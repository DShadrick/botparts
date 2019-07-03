var express = require('express');
var logger = require('morgan');
var apiInit = require('./api').init;
var routes = require('./routes');
var utilInit = require('./lib/utils').init
var app = express();

//app.use(logger('dev'));
app.use(function(req,res,next) {
  res.stash = {};
  return next();
});

utilInit(app);
apiInit(app);
routes.register(app);

app.listen(3000, function(){
  console.log('Listening on 3000');
});
