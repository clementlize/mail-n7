import React, { Component } from 'react';
import { Helmet } from 'react-helmet';


import Loading from './Loading';
import Header from './Header';
import GlobalStats from './GlobalStats';
import Statistiques from './Statistiques';
import Footer from './Footer';

import '../css/App.css';

class App extends Component {

  constructor(props){
    super(props);
    this.state ={
      isLoading: true,
      needRefresh: false,
      theme_color: "#28a745"
    };
  }

  refreshMainApi = (whichlist) => {

      fetch(process.env.REACT_APP_API_URL_GET, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'token': process.env.REACT_APP_API_TOKEN,
          'whichlist': whichlist
        },
      })
      .then((response) => response.json())
      .then((responseJson) => {

        this.setState({
          isLoading: false,
          dataSource: responseJson,
        }, function(){

          if (this.state.dataSource.minutes_diff > 60) {

            document.body.style.setProperty('--main-color', 'var(--orange)');
            this.setState({needRefresh: true, theme_color: "#fd7e14"});
          }
          else {

            document.body.style.setProperty('--main-color', 'var(--green)');
            this.setState({needRefresh: false, theme_color: "#28a745"});
          }

        });

      })
      .catch((error) =>{
        console.error(error);
    });
  }

  componentDidMount(){

    this.refreshMainApi(this.props.whichlist);
    this.interval = setInterval(() => {
      this.refreshMainApi(this.props.whichlist);
    }, 60000);

  }

  componentWillUnmount() {

    clearInterval(this.interval);
  }

  doesItNeedRefresh = () => {

    var myClass = "btn btn-outline-light ";
    
    if (this.state.needRefresh) {

      myClass += 'animate2'
    }

    return myClass;

  }
 
  render() {

    if(this.state.isLoading){
      return(
          <Loading />
      )
    }

      return (
        <div>
          <Helmet>
            <meta name="theme-color" content={this.state.theme_color} />
          </Helmet>
          <Header
            last_refresh={this.state.dataSource.last_refresh}
            last_refresh_mins={this.state.dataSource.minutes_diff}
            needsRefresh={this.doesItNeedRefresh.bind(this)}
            refreshAPI={this.refreshMainApi.bind(this)}
            whichlist={this.props.whichlist}
          />
          <GlobalStats
            nombre_mails={this.state.dataSource.total_emails}
            total_mails={this.state.dataSource.total_emails_envoyes}
            whichlist={this.props.whichlist}
          />
          <Statistiques
            topic={"ENVOYEURS"}
            top_content={this.state.dataSource.top_senders}
          />
          <Statistiques
            topic={"SUJETS"}
            top_content={this.state.dataSource.top_subjects}
          />
          <Statistiques
            topic={"JOURS"}
            top_content={this.state.dataSource.top_jours}
          />
          <Footer />
        </div>
      );
    }
  
}

export default App;
