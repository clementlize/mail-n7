var express = require('express');
var router = express.Router();

var Imap = require('imap');
var inspect = require('util').inspect;

var deasync = require('deasync');

var functions = require('../functions/functions.js');

var mysql = require('mysql');

// SQL CREDENTIALS FOR PRODUCTION
var sqlconnect = mysql.createConnection({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: "N7"
});

/**
 * Mise à jour de la DB. Voir doc dans ../functions/functions.js
 */
router.get('/update_db', function(req, res) {

    // Récupération des headers
    var _token = req.headers.token;

    console.log("token : "+JSON.stringify(_token))

    // Validation du token et appel de la fonction
    if (_token === process.env.API_TOKEN) {

        res.end(JSON.stringify(functions.update_db(Imap, inspect, sqlconnect)));
    }
    else {

        res.end("Permission denied")
    }
    
});

/**
 * Récupération des statistiques. Voir doc dans ../functions/functions.js
 */
router.get('/get_stats', function(req, res) {

    // Récupération des headers
    var _token = req.headers.token;
    var whichlist = req.headers.whichlist;

    console.log("token : "+JSON.stringify(_token))

    // Validation du token et appel de la fonction
    if (_token === process.env.API_TOKEN) {

        res.end(JSON.stringify(functions.make_stats(sqlconnect, whichlist)));
    }
    else {

        res.end("Permission denied")
    }
    
});

module.exports = router;
