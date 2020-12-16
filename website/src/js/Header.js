import React, { Component } from 'react';
import '../css/Header.css';

class Header extends Component {

    constructor(props){
        super(props);
        this.state ={
            isItLoading: false,
            dataFetched: "null",
            animateText: false,
        }
    }

    refreshData = () => {

        this.setState({ isItLoading: true }, () => {

            fetch(process.env.REACT_APP_API_URL_REFRESH, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'token': process.env.API_TOKEN
                },
                })
                .then((response) => response.json())
                .then((responseJson) => {

                    this.setState({
                        isItLoading: false,
                        dataFetched: responseJson,
                        animateText: true
                    }, function(){

                    });

                    this.props.refreshAPI(this.props.whichlist);


                })
                .catch((error) =>{
                console.error(error);
            });

        });
    }

    renderLoading = () => {

        if (this.state.isItLoading) {

            return (
                <div className="spinner-border text-light ml-5" role="status">
                    <span className="sr-only">Loading...</span>
                </div>
            )

        }
        else {
            return (

                <div></div>
            )
        }
    }

    render() {

        return (
            <div className="main_component mt-md-5">
            
                <header className="container-fluid">

                    <div className="container">

                        <div className="row align-items-center justify-content-center h-100">

                            <div className="col-md-6 align-items-center shadow p-3 bg-white rounded mt-4 mb-md-0 my-md-2">

                                <div className="row align-items-center justify-content-center h-50">

                                    <p className="text-center" id="header_title">MAIL N7</p>

                                </div>

                                <div className="row align-items-center justify-content-center h-50">

                                    <div className="col-md-5 align-items-center">
                                        <p className="text-center mb-2 mb-md-0" id="header_subtitle">{this.props.whichlist}</p>
                                    </div>

                                    <div className="col-md-4 align-items-center">

                                        <div className="row align-items-center justify-content-center h-100">
                                            <a href={this.props.whichlist==="tous.etudiants" ? "/listes" : "/"}>
                                            <button
                                            className="btn btn-outline-main-color"
                                            >
                                                Changer
                                            </button>
                                            </a>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            <div className="col-md-6 py-4 py-md-0 px-4 px-md-5 align-items-center">

                                    <p
                                        onAnimationEnd={() => this.setState({ animateText: false })}
                                        className={this.state.animateText ? 'animate' : ''+"mb-2"}
                                        id="text_header"
                                    >
                                        Dernière actualisation : {this.props.last_refresh} &nbsp; (il y a {this.props.last_refresh_mins} minutes)
                                    </p>
                                    <button
                                        onClick={this.refreshData.bind(this)}
                                        className={this.props.needsRefresh()}
                                        id="refresh_button"
                                    >
                                        Actualiser
                                    </button>
                                    <this.renderLoading />

                            </div>

                        </div>

                    </div>

                </header>

            </div>
        );
    }
}

export default Header;