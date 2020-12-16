import React, { Component } from 'react';

class Bar extends Component {

    getClassName = () => {

        console.log(String.concat("percentage percentage-", this.props.bar_value.toString()));
        return String.concat("percentage percentage-", this.props.bar_value.toString());
    }

    render() {
        
        return (
            <div>
                <dl>
                    <dd className={"percentage percentage-"+this.props.bar_value}>
                        <span className="text">
                        {this.props.bar_content} &nbsp; : &nbsp; {this.props.bar_apparitions}
                        </span>
                    </dd>
                </dl>
            </div>
        )
    }
}

export default Bar;