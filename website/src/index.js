import React from 'react';
import ReactDOM from 'react-dom';
import App from './js/App';
import './index.css';

require('dotenv').config();

import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";

ReactDOM.render(

  <Router>
    <div>
      <Switch>
        <Route exact path="/">
          <App 
            whichlist="tous.etudiants"
          />
        </Route>
        <Route path="/listes">
        <App 
            whichlist="@listes-diff"
          />
        </Route>
      </Switch>
    </div>
  </Router>,

  document.getElementById('root')
);
