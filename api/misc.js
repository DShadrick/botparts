var request = require('request');
var BaseAPI = require('./BaseAPI');
var bufferResponse = require('../lib/utils').bufferResponse;
var Deck = require('../lib/Deck');

var miscAPI = new BaseAPI({
  name: 'Misc api',
  routePrefix: '/misc',
  routeInfo: [
    {
      name: 'rollDice',
      description: 'Rolls an arbitrary number of dice'
    }
  ],
  init: function init() {
    this.router.get('/roll/:stream/:dice', roll);
    this.router.get('/draw/:stream/?', draw);
  }
});

function roll(req, res) {
  var dice = (req.params.dice || '').split(/d/i);
  var rolls = [];
  var total;
  var response;

  if(dice.length !== 2 || !/\d+d\d+/i.test(req.params.dice)) {
    return res.send("@$user, I don't know what that means. To roll dice, tell me the number of dice to roll, and the number of sides per die, seperated by the letter \"d\". (eg. 3d6)");
  } else if (!parseInt(dice[0], 10) > 0) {
    return res.send("@$user, negative dice? What the hell is wrong with you?");
  } else if (!parseInt(dice[0], 10)) {
    return res.send("@$user, you can't roll no dice, jackass.");
  } else if (!parseInt(dice[1], 10)) {
    return res.send("@$user, go find me some dice with no sides. Go ahead. I'll wait.");
  } else if (dice[1] == "1") {
    return res.send("@$user, dice with one side. Gee, I wonder what they'll roll.");
  } else if (dice[0] > 100) {
    return res.send("@$user, really? You wanna roll " + dice[0] + " dice? Really? Come on. Give me a good reason. Oh you've got nothing? Yeah I didn't think so.")
  }

  for(var i = 0; i < dice[0]; i++) {
    rolls.push(Math.floor(Math.random() * parseInt(dice[1]))+1);
  }

  response = "@$user rolls " + dice[0] + " d" + dice[1] + ": " + rolls.join(', ') + '. Total: ' + rolls.reduce(function(a, b){return a+b});

  if(response.length > 500) {
    return res.send("@$user, that's too many dice. I don't wanna spend all day telling you how many of them were what. Roll fewer.");
  }

  return res.send(bufferResponse(response));
}

function draw(req, res) {
  return res.send('@$user, you drew ' + new Deck().drawCard().name)
}

module.exports = miscAPI;


