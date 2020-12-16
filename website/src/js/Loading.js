import React, { Component } from 'react';
import '../css/Loading.css'

class Loading extends Component {

    render() {
        
        return (
            <div id="main_container" className="container-fluid align-items-center justify-content-center h-100">
                
                <div className="row h-100">
                    <div className="container col-4 my-auto shadow p-3 bg-white rounded">

                        <p className="text-center" id="loading_text">Loading...</p>

                        <div className="text-center">
                            <div className="spinner-border text-success m-2" role="status">
                                <span className="sr-only">Loading...</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        )
    }
}

export default Loading;