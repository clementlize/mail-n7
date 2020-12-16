require('dotenv').config();
console.log(process.env.SQL_USER);

var express = require('express'),
  app = express(),
  port = process.env.PORT || process.env.SERVER_PORT;

var routes = require('./api/routes/routes'); //importing route
app.use('/', routes);

app.listen(port);

console.log('API server started on port: ' + port);