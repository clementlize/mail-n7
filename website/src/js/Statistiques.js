import React, { Component } from 'react';

import DiagramBar from './DiagramBar.js'

class Statistiques extends Component {

    render() {
        
        return (
            <div className="mt-5">

                <div className="container shadow p-3 bg-white rounded">

                    <h3 className="mb-4 text-center">TOP DES {this.props.topic}</h3>

                    <div className="row align-items-center">

                        <div className="col-1"></div>

                        <div className="col-10">

                            <DiagramBar
                                top_content={this.props.top_content}
                            />

                        </div>

                    </div>
                    
                </div>
            </div>
        )
    }
}

export default Statistiques;