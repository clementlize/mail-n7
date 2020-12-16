var emojiStrip = require('emoji-strip');
const { json } = require('express');

/* DOC :
    box.messages.total = nb de messages

    f.on 
        seqno : ID du message

    stream.once('end)
        Imap.parseHeader(buffer).from
        Imap.parseHeader(buffer).to
        Imap.parseHeader(buffer).subject

    msg.once('end')
        attrs.date
*/

module.exports = {

    /**
     * Fonction principale pour la mise à jour de la base de données
     * Réalise un fetch IMAP, traite les données et met à jour la table "emails_brut"
     * @param {*} Imap Module node-imap
     * @param {*} inspect 
     * @param {*} sqlconnect Connexion à la DB mySQL
     */
    update_db:function(Imap, inspect, sqlconnect){

        // Objet imap pour la connexion IMAP
        var imap = new Imap({
            user: process.env.IMAP_USER,
            password: process.env.IMAP_PASSWORD,
            host: process.env.IMAP_HOST,
            port: 993,
            tls: true
        });

        function openInbox(cb) {
            imap.openBox('INBOX', true, cb);
        }

        // Récupération de la dernière ligne de la base de données existante dans la variable _retourDb
        var _retourDb;
        var _dbRead_finished;
        sqlconnect.query("SELECT * FROM emails_brut ORDER BY id DESC LIMIT 1", function (err, result, fields) {
            if (err) throw err;
            _retourDb = result;
            _dbRead_finished = true;
        });

        while (_dbRead_finished === undefined) {
            require('deasync').runLoopOnce();
        }

        // Date et id de la dernière ligne
        var last_date = _retourDb[0].date;
        var last_id = _retourDb[0].id;

        var _imap_data = [];
        var imap_finished;

        // Fetch IMAP
        imap.once('ready', function() {
            openInbox(function(err, box) {

                if (err) throw err;
                var f = imap.seq.fetch('1:'+box.messages.total, {
                    bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
                    struct: true
                });

                f.on('message', function(msg, seqno) {

                    //console.log('Message #%d', seqno);

                    var prefix = '(#' + seqno + ') ';

                    msg.on('body', function(stream, info) {
                        var buffer = '';

                        stream.on('data', function(chunk) {
                            buffer += chunk.toString('utf8');
                        });

                        stream.once('end', function() {
                            _imap_data.push(prefix + 'Parsed header: %s', inspect(Imap.parseHeader(buffer)));
                        });
                    });
                    msg.once('end', function() {
                        console.log(prefix + 'Finished');
                    });
                });
                f.once('error', function(err) {
                    console.log('Fetch error: ' + err);
                });
                f.once('end', function() {
                    console.log('Done fetching all messages!');
                    imap.end();
                });
            });
          });
           
        imap.once('error', function(err) {
            console.log(err);
        });
        
        imap.once('end', function() {
            console.log('Connection ended');
            imap_finished = true;
        });
        
        // Lancement du Fetch
        imap.connect();

        // Wait for the fetch to finish
        while (imap_finished === undefined) {
            require('deasync').runLoopOnce();
        }

        // Lancement du traitement des données
        return this.update_db_store(sqlconnect, _imap_data, last_date, last_id);
          
    },

    /**
     * Traiter les données récupérées par le fetch IMAP et les inscrire dans la base de données
     * @param {*} sqlconnect Connexion à la DB mySQL
     * @param {*} _imap_data Données récupérées par le fetch IMAP
     * @param {*} last_date Date du dernier message stocké
     * @param {*} last_id id du dernier message stocké
     */
    update_db_store:function(sqlconnect, _imap_data, last_date, last_id) {
        
        var sql_values = [];      
        var sql_row = [];
        var json_obj;

        var regex_finished;

        // Parcourt chaque ligne des données IMAP, applique les regex et les ajoute au tableau sql_values
        for (i=0; i<_imap_data.length; i++) {

            // Ligne paire : inutiles, seu
            if (i%2 === 0) {

                sql_row = [];
                sql_row.push(i/2);
                sql_row.push(parseInt(_imap_data[i][2]));

            } // Ligne impaire : données 
            else {

                // Regex pour formater les données
                json_obj = _imap_data[i].replace(/\n/g, "");
                json_obj = json_obj.replace(/"/g, '\\"');
                json_obj = json_obj.replace(/\s+/g, " ");
                json_obj = json_obj.replace(/date:/, '"date":');
                json_obj = json_obj.replace(/from:/, '"from":');
                json_obj = json_obj.replace(/to:/, '"to":');
                json_obj = json_obj.replace(/subject:/, '"subject":');
                json_obj = json_obj.replace(/(?<=("date": *)|("from": *)|("to": *)|("subject": *))\[ *'/g, '"');
                json_obj = json_obj.replace(/(?<=("date": *)|("from": *)|("to": *)|("subject": *))\[ */g, '"');  // sans apostrophe (fallback)
                json_obj = json_obj.replace(/' *](?=(, *"from")|(, *"to")|(, *"subject")|( *})|(, *"date"))/g, '"');
                json_obj = json_obj.replace(/ *](?=(, *"from")|(, *"to")|(, *"subject")|( *})|(, *"date"))/g, '"');  // sans apostrophe (fallback)

                // Parsing des données en objet JSON
                json_obj = JSON.parse(json_obj);
                
                // Prise en compte des champs nuls éventuels
                if (json_obj.from === undefined) {
                    json_obj.from = "null";
                }

                if (json_obj.to === undefined) {
                    json_obj.to = "null";
                }

                if (json_obj.subject === undefined) {
                    json_obj.subject = "null";
                }
                else {
                    // Enlèvement des emoji éventuels, enlèvement de la mention [tous.etudiants]
                    json_obj.subject = emojiStrip(json_obj.subject.replace(/\[tous\.etudiants\] /g, ""));
                }

                if (json_obj.date === undefined) {
                    json_obj.date = "null";
                }
                else {
                    // Ajout de la date en format timestamp pour le tri
                    json_obj.timestamp = Date.parse(json_obj.date);
                }

                // Ajout des id, inutile mais requis pour la mise en forme dans la DB
                json_obj.id_broken = sql_row[0];
                json_obj.id_imap = sql_row[1];

                // Push de la donnée dans le grand tableau
                sql_values.push(json_obj);

                // Arrivée à la fin
                if (sql_values.length === (_imap_data.length/2)) {
                    regex_finished = true;
                }
            }
        }

        // Attente que le tableau soit rempli
        while (regex_finished === undefined) {
            require('deasync').runLoopOnce();
        }

        // Tri par ordre décroissant
        sql_values.sort(function(a, b) {
            return parseFloat(b.timestamp) - parseFloat(a.timestamp);
        });

        var sql_values_array = [];

        // Conversion en tableaux et ajout de l'id
        for (var j=sql_values.length-1; j>=0; j--) {

            var tempArray = [];
            tempArray.push(j);
            tempArray.push(0);
            tempArray.push(sql_values[j].from);
            tempArray.push(sql_values[j].to);
            tempArray.push(sql_values[j].subject);
            tempArray.push(sql_values[j].date);

            sql_values_array.push(tempArray);
        }

        // On remplace le json par le tableau
        sql_values = sql_values_array;

        var sql_push = false;
        var date_trouvee = false;
        var sql_values_final = [];
        var recherche_terminee;
        var this_id = 0;

        console.log("last_date : "+ last_date);
        console.log("last_id : "+ last_id);
        
        for (i=0; i<sql_values.length; i++) {

            if (date_trouvee) {

                sql_values_final.push(sql_values[i]);
                sql_values_final[this_id][0] = last_id + this_id +1;
                this_id++;
            }
            else if ( !date_trouvee && sql_values[i][5] === last_date) {
                date_trouvee = true;
            }

            if (i === sql_values.length -1) {
                recherche_terminee = true;
            }
        }

        while (recherche_terminee === undefined) {
            require('deasync').runLoopOnce();
        }

        //return JSON.stringify(sql_values_final);

        if (sql_values_final[0] != undefined) {
            sql_push = true;
            console.log("Du nouveau !!");
        } else {
            console.log("Pas de nouveaux mails :)");
        }

        //return JSON.stringify(sql_values);

        if (sql_push) {

            sql_values[0].splice(0, i);

            console.log("Début du push SQL");


            var sql_query = "INSERT INTO emails_brut (id, imap_id, sender, dest, subject, date) VALUES ?";

            sqlconnect.query(sql_query, [sql_values_final], function (err, result) {
                if (err) throw err;
                console.log("Number of records inserted: " + result.affectedRows);
            });

        }

        ///// Ajout de la date de refresh dans le log
        var today = new Date();

        var currentHours = today.getHours();
        currentHours = ("0" + currentHours).slice(-2);

        var currentMins = today.getMinutes();
        currentMins = ("0" + currentMins).slice(-2);

        var date_and_time = today.getDate()+'/'+(today.getMonth()+1)+'/'+today.getFullYear()+', '+currentHours+ ":" +currentMins;

        var sql_query2 = "INSERT INTO update_log (mydate, date_brut) VALUES (?)";
        sqlconnect.query(sql_query2, [[date_and_time, String(today)]], function (err, result) {
            if (err) throw err;
            console.log("Inserted date in log!");
        });

        return {
            "status": "ok"
        };
    },

    make_stats:function(sqlconnect, whichlist){

        console.log("Début de make_stats");

        /////  RECUPERATION DE LA DB  /////
        var _retourDb;
        var _dbRead_finished;
        sqlconnect.query("SELECT * FROM emails_brut ORDER BY id", function (err, result, fields) {
            if (err) throw err;
            _retourDb = [...result];
            _dbRead_finished = true;
        });
        while (_dbRead_finished === undefined) {
            require('deasync').runLoopOnce();
        }

        /*console.log("fin de la récup emails_brut");
        console.log(_retourDb);*/

        var _retourDb2;
        var _dbRead_finished2;
        sqlconnect.query("SELECT * FROM update_log ORDER BY id DESC LIMIT 1", function (err, result, fields) {
            if (err) throw err;
            _retourDb2 = result;
            _dbRead_finished2 = true;
        });

        while (_dbRead_finished2 === undefined) {
            require('deasync').runLoopOnce();
        }

        //console.log(_retourDb2);

        /////  DONNEES SUR LES LISTES  /////
        var listes_diff = {    // Nombre de personnes par liste de diffusion
            "tous.etudiants": 1531
        }
        var convert_month = {
            "01" : "Jan",
            "02" : "Feb",
            "03" : "Mar",
            "04" : "Apr",
            "05" : "May",
            "06" : "Jun",
            "07" : "Jul",
            "08" : "Aug",
            "09" : "Sept",
            "10" : "Oct",
            "11" : "Nov",
            "12" : "Dec",
        }

        var final_json = {};

        /////////  DEBUT DES STATS  //////////

        var mail_counter = 0;  // Nombre de mails total diffusés sur mon adresse
        var mail_today_counter = 0;
        
        var subject_found;  // Dit pour chaque mail si le sujet existe déjà
        var subjects = [];  // Les sujets ainsi que leur nombre d'apparitions sont stockés ici.
        var subject = {};  // Sujet actuel, actualisé pour chaque email
        var this_subject;

        var sender_found;  // Dit pour chaque mail si le sender existe déjà
        var senders = [];  // Les senders ainsi que leur nombre de mails envoyés sont stockés ici.
        var sender = {};  // Sender actuel, actualisé pour chaque email
        var this_sender;

        var date_found;  // Dit pour chaque mail si le sender existe déjà
        var dates = [];  // Les senders ainsi que leur nombre de mails envoyés sont stockés ici.
        var date = {};  // Sender actuel, actualisé pour chaque email

        var rightNow = new Date();  // Date actuelle
        var now_date = rightNow.toISOString().slice(0,10);  // Date actuelle modifiee
        now_date = now_date.substring(8,10)+" "+convert_month[now_date.substring(5,7)]+" "+now_date.substring(0,4);
        console.log(now_date);

        var last_refresh_date = new Date(_retourDb2[0].date_brut);
        var diff_minutes = Math.round(( (rightNow - last_refresh_date) /1000)/60);

        var main_loop_finished;
        for (i=0; i<_retourDb.length; i++) {

            if (
                (whichlist==="tous.etudiants" && _retourDb[i].dest.includes("tous.etudiants@listes-diff.enseeiht.fr"))
                ||
                (whichlist==="@listes-diff" && _retourDb[i].dest.includes("@listes-diff.enseeiht.fr"))
            
            ) {  // Ce mail est un mail de diffusion

                ////////// Nombre total de mails
                mail_counter++;


                ////////// Total aujourd'hui
                var email_date = _retourDb[i].date;
                email_date = email_date.match(/[0-9]+ [A-Za-z]{3} [0-9]{4}/g);
                email_date = email_date[0];
                //console.log(email_date);
                if (email_date === now_date) {
                    mail_today_counter++;
                }


                ////////// Sujets récurrents
                subject_found = false;
                this_subject = _retourDb[i].subject;
                this_subject = this_subject.replace(/Fwd: /g, "");
                for (j=0; j<subjects.length; j++) {

                    if (subjects[j]["content"] === this_subject) {
                        subject_found = true;
                        subjects[j]["apparitions"]++;
                    }
                }
                if (!subject_found) {
                    subject = {};
                    subject["content"] = this_subject;
                    subject["apparitions"] = 1;
                    subjects.push(subject);
                }


                ////////// Senders récurrents
                sender_found = false;
                this_sender = _retourDb[i].sender;
                    this_sender = this_sender.match(/[A-Za-z0-9.-]+@[A-Za-z0-9.-]+/g);
                    this_sender = this_sender[0].replace(/@[A-Za-z.-]+/g, "");

                    // Vérification si on a un sender du type nom.prenom
                    if (this_sender.match(/[A-Za-z]+\.[A-Za-z]+/g) == this_sender) {

                        this_sender = this_sender.replace(/(?<=\.[A-Za-z])[A-Za-z.-_]+/g, "")
                        this_sender = this_sender.replace(/\./g, " ");
                        this_sender = this_sender.charAt(0).toUpperCase() + this_sender.slice(1)
                        this_sender = this_sender.split(" ");
                        this_sender[1] = this_sender[1].toUpperCase();
                        this_sender = this_sender.join(" ");

                    }

                for (j=0; j<senders.length; j++) {

                    if (senders[j]["content"] === this_sender) {
                        sender_found = true;
                        senders[j]["apparitions"]++;
                    }
                }
                if (!sender_found) {
                    sender = {};
                    sender["content"] = this_sender;
                    sender["apparitions"] = 1;
                    senders.push(sender);
                }


                ////////// Top des jours
                date_found = false;
                for (j=0; j<dates.length; j++) {

                    if (dates[j]["content"] === email_date) {
                        date_found = true;
                        dates[j]["apparitions"]++;
                    }
                }
                if (!date_found) {
                    date = {};
                    date["content"] = email_date;
                    date["apparitions"] = 1;
                    dates.push(date);
                }

            }

            if (i === _retourDb.length -1) {
                main_loop_finished = true;
            }
        }

        console.log("avant la deasync");

        while (main_loop_finished === undefined) {
            require('deasync').runLoopOnce();
        }

        ////////// Sujets récurrents
        var top_subjects = {};  // Top sujets, par classement avec contenu et nombre d'apparitions
        var max_subjects, index_subjects;
        for (i=0; i<5; i++){
            max_subjects = 0;
            index_subjects = 0;
            for (j=0; j<subjects.length; j++) {
                if (subjects[j].apparitions > max_subjects) {
                    max_subjects = subjects[j].apparitions;
                    index_subjects = j;
                }
            }
            top_subjects[i] = subjects[index_subjects];
            subjects.splice(index_subjects, 1);
        }

        ////////// Senders récurrents
        var top_senders = {};  // Top senders, par classement avec contenu et nombre d'apparitions
        var max_senders, index_senders;
        for (i=0; i<5; i++){
            max_senders = 0;
            index_senders = 0;
            for (j=0; j<senders.length; j++) {
                if (senders[j].apparitions > max_senders) {
                    max_senders = senders[j].apparitions;
                    index_senders = j;
                }
            }
            top_senders[i] = senders[index_senders];
            senders.splice(index_senders, 1);
        }


        ////////// Top des jours
        var top_dates = {};  // Top jours, par classement avec contenu et nombre d'apparitions
        var max_dates, index_dates;
        for (i=0; i<5; i++){
            max_dates = 0;
            index_dates = 0;
            for (j=0; j<dates.length; j++) {
                if (dates[j].apparitions > max_dates) {
                    max_dates = dates[j].apparitions;
                    index_dates = j;
                }
            }
            top_dates[i] = dates[index_dates];
            dates.splice(index_dates, 1);
        }


        /////  AFFECTATIONS FINALES  /////

        final_json["last_refresh"] = _retourDb2[0].mydate;
        final_json["minutes_diff"] = diff_minutes;
        final_json["total_emails"] = mail_counter;
        final_json["total_emails_envoyes"] = mail_counter * listes_diff["tous.etudiants"];
        final_json["total_emails_today"] = mail_today_counter;
        final_json["top_senders"] = top_senders;        
        final_json["top_subjects"] = top_subjects;
        final_json["top_jours"] = top_dates;

        console.log("stats done!");
        return final_json;
    }
}   