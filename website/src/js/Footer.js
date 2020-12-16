import React, { Component } from 'react';
import '../css/Footer.css';

class Footer extends Component {

    render() {
        
        return (
            <div className="mt-5">
                <div className="container-fluid bg-dark p-4">

                    <p className="text-center text-light"> - Développé par <a href="https://clementlize.com" target="_blank">Clément Lizé</a> - </p>
                    <p className="mt-4 mb-2 text-light">Comment ça marche ?</p>
                    <p className="text-light howto text-justify">Un clic sur le bouton actualiser va envoyer une requête à une API qui se charge de lire 
                    tous les mails présents sur ma boite de réception <i>@etu.---.fr</i>, et de les stocker dans une base de données. A chaque 
                    connexion sur ce site et toutes les minutes pour chaque session, une requête est envoyée à une deuxième API qui se charge 
                    d'élaborer des statistiques sur tous les mails à destination de la liste <i>tous.etudiants</i> à partir de la base 
                    de données. Le site, dynamiquement codé grâce au framework <i>React JS</i> affiche les résultats et les actualise en 
                    temps réel. <br/>
                    Le code de ce projet sera prochainement disponible en open source sur Github.</p>

                </div>
            </div>
        )
    }
}

export default Footer;