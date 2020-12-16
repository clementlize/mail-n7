import React, { Component } from 'react';
import '../css/GlobalStats.css';



class AllEtu_stats extends Component {

    render() {

        if (this.props.whichlist === "tous.etudiants") {

            return (
                <div>
                    <p className="mb-2"> <span className="nbre_mails">{this.props.nombre_mails}</span>&nbsp; mails envoyés sur la liste <span className="tous_etudiants">[tous.etudiants]</span> depuis le <i>29/08/2019</i></p>
                    <p className="mb-2"> <span className="nbre_mails">1531</span>&nbsp; étudiants inscrits sur la liste <span className="tous_etudiants">[tous.etudiants]</span></p>
                    <p> <span className="nbre_mails">{this.props.total_mails}</span>&nbsp; mails envoyés au total depuis le <i>29/08/2019</i></p>
                </div>
            );
        } 
        else {
            return (
                
                <p className="mb-2"> <span className="nbre_mails">{this.props.nombre_mails}</span>&nbsp; mails envoyés sur les listes <span className="tous_etudiants">[@listes-diff]</span> depuis le <i>29/08/2019</i></p>
            );
        }

    }   
}


class GlobalStats extends Component {


    render() {
        
        return (
            <div className="mt-5">
                <div className="container shadow p-3 bg-white rounded">

                    <h3 className="mb-4 text-center">STATISTIQUES GLOBALES</h3>
                    
                    <AllEtu_stats
                        whichlist={this.props.whichlist}
                        total_mails={this.props.total_mails}
                        nombre_mails={this.props.nombre_mails}
                    />
                   
                </div>
            </div>
        )
    }
}

export default GlobalStats;