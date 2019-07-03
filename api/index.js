var BaseAPI = require('./BaseAPI');
var apiArr = [
  require('./boi'),
  require('./blackjack'),
  require('./roulette'),
  require('./tower'),
  require('./misc')
];

module.exports = {
  init: function(app) {
    console.log('Initializing APIs');
    for(var i = 0; i < apiArr.length; i++) {
      try{
        if(apiArr[i] instanceof BaseAPI) {
          console.log(apiArr[i].name + ' Initializing.');
          apiArr[i].init();
          app.use(apiArr[i].routePrefix, apiArr[i].router);
          console.log(apiArr[i].name + ' successfully initialized.');
        } else {
          throw "The API must be an instance of BaseAPI.";
        }
      } catch(e){
        console.log((apiArr[i].name || 'An unnamed API') + ' failed to initialze');
        console.log(e.stack);
      }
    }
  }
}
