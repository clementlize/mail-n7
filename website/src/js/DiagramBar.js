import React, { Component } from 'react';
//import Bar from './Bar'
import {HorizontalBar} from 'react-chartjs-2';
import 'chartjs-plugin-datalabels';
  

class DiagramBar extends Component {

    getData = () => {

        var setLabels = [];
        var setData = [];

        for (var i=0; i<5; i++) {

            setLabels.push(this.props.top_content[i].content);
            setData.push(this.props.top_content[i].apparitions);
        }

        return {
            labels: setLabels,
            datasets: [
                {
                    label: '',
                    backgroundColor: 'rgba(40,167,69,0.2)',
                    borderColor: 'rgba(40,167,69,1)',
                    borderWidth: 1,
                    hoverBackgroundColor: 'rgba(40,167,69,0.4)',
                    hoverBorderColor: 'rgba(40,167,69,1)',
                    data: setData
                }
            ]
        };
    }

    getOptions = () => {
        return {
            scales: {
                yAxes: [{
                    gridLines: {
                        display: false
                    }
                }],
                xAxes: [{ 
                    display: false,
                    ticks: {
                        beginAtZero: true,
                        min: 0
                      }   
                }],
            },
            legend: {
                display: false
            },
            plugins: {
                datalabels: {
                   anchor: 'end',
                   align: 'left'
                }
            },
            tooltipCaretSize:0
        };
    }

    render() {        
        return (
            <div>
                <HorizontalBar
                    data={this.getData()}
                    options={this.getOptions()}
                />
            </div>
        )
    }
}

export default DiagramBar;