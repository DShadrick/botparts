var BaseAPI = require('./BaseAPI');
var addPointCmd = require('../lib/utils').addPointCmd;
var getUser = require('../lib/utils').getUser;
var updateUser = require('../lib/utils').updateUser;
var redNums = [32,19,21,25,34,27,36,30,23,5,16,1,14,9,18,7,12,3];
var blackNums = [15,4,2,17,6,13,11,8,10,24,33,20,31,22,29,28,35,2];

var rouletteAPI = new BaseAPI({
  name: 'Roulette api',
  routePrefix: '/roulette',
  routeInfo: [
    {
      name: '/play/<player>?input=<space delineated inputs. wager first>',
      description: 'Generates a random number and returns winnings based on '
    }
  ],
  init: function init() {
    this.router.get('/play/:stream/:user', getGameData, play);
  }
});

module.exports = rouletteAPI;

function getGameData(req, res, next) {
  getUser(req.params.stream.toLowerCase(), req.params.user.toLowerCase(), function(user){
    if(!user.gameData.roulette) {
      user.gameData.roulette = {
        gamesPlayed: 0,
        gamesWon: 0,
        gamesLost: 0,
        partsWon: 0,
        partsLost: 0,
        oddBets: 0,
        evenBets: 0,
        numberBets: 0,
        redBets: 0,
        blackBets: 0
      }
    }
    res.stash.user = user;
    next();
  })
}

function play(req, res, next) {
  if(!req.query.input) {
    return res.status(400).send();
  }
  var gameData = res.stash.user.gameData.roulette;
  var splitQuery = req.query.input.split(' ');
  var wager = parseInt(splitQuery[0] || 0);
  var bet1 = (splitQuery[1] || '').toLowerCase();
  var bet2 = (splitQuery[2] || '').toLowerCase();
  var number = false;
  var color = false;
  var parity = false;
  var spin = Math.floor(Math.random() * 37);
  var multiplier = 0;
  var spinMsg = 'Spinning! The ball landed on ' + spin + '(' + resolveColor(spin) + '). ';

  if(wager <= 0) {
    return res.send('You gotta wager to spin');
  }

  gameData.gamesPlayed++;

  if(bet1 === 'red' || bet2 === 'red') {
    color = 'red';
    gameData.redBets++;
  }

  if(bet1 === 'black' || bet2 === 'black') {
    color = 'black';
    gameData.blackBets++;
  }

  if(bet1 === 'odd' || bet2 === 'odd') {
    parity = 'odd';
    gameData.oddBets++;
  } else if(bet1 === 'even' || bet2 === 'even') {
    parity = 'even';
    gameData.evenBets++;
  }

  if(parseInt(bet1) >= 0) {
    number = parseInt(bet1);
    gameData.numberBets++;
  } else if (parseInt(bet2) >= 0) {
    number = parseInt(bet2);
    gameData.numberBets++;
  }

  if(number > 36 || number < 0) {
    gameData.numberBets--;
    return res.send(addPointCmd(wager, 'The wheel only runs from 0 to 37, champ.'));
  }

  if(!parity && !color && !number !== false && !(number === 0)) {
    return res.send(addPointCmd(wager, 'You gotta bet on something!'));
  }

  if(number === spin) {
    multiplier = 35;
    gameData.gamesWon++;
    gameData.partsWon += wager * multiplier - wager;
    res.stash.user.partsWon += wager * multiplier - wager;
    res.stash.user.gameData.roulette = gameData;
    updateUser(res.stash.user, function(){
    });
    return res.send(addPointCmd(wager*multiplier,  spinMsg + 'Right on the nose. You some kind of wizard? You get ' + wager*multiplier +'Ƥ'));
  } else {
    if(parity && parity === resolveParity(spin)) {
      multiplier += 2;
    } else if(parity) {
      gameData.gamesLost++;
      gameData.partsLost += wager;
      res.stash.user.partsLost += wager;
      res.stash.user.gameData.roulette = gameData;
      updateUser(res.stash.user, function(){});
      return res.send(spinMsg + "Can't win 'em all.");
    }

    if(color && color == resolveColor(spin)) {
      multiplier += 2;
    } else if(color) {
      gameData.gamesLost++;
      gameData.partsLost += wager;
      res.stash.user.partsLost += wager;
      res.stash.user.gameData.roulette = gameData;
      updateUser(res.stash.user, function(){});
      return res.send(spinMsg + "Can't win 'em all.")
    }
  }

  if(multiplier) {
    gameData.gamesWon++;
    gameData.partsWon += wager * multiplier - wager;
    res.stash.user.partsWon += wager * multiplier - wager;
    res.stash.user.gameData.roulette = gameData;
    updateUser(res.stash.user, function(){});
    return res.send(addPointCmd(wager*multiplier, spinMsg + "You did it! Enjoy " + wager*multiplier + 'Ƥ!'));
  } else {
    gameData.gamesLost++;
    gameData.partsLost += wager;
    res.stash.user.partsLost += wager;
    res.stash.user.gameData.roulette = gameData;

    updateUser(res.stash.user, function(){});
    res.send(spinMsg + "Can't win 'em all.");
  }
}

function resolveColor(value) {
  if(value == 0) {
    return 'green';
  }

  return (redNums.indexOf(value) !== -1) ? 'red' : 'black';
}

function resolveParity(value) {
  if(value == 0) {
    return 'zero';
  }
  return !(value & 1) ? 'even' : 'odd';
}
