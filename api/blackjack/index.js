var BaseAPI = require('../BaseAPI');
var Deck = require('../../lib/Deck');
var addPointCmd = require('../../lib/utils').addPointCmd;
var removePointCmd = require('../../lib/utils').removePointCmd;
var getUser = require('../../lib/utils').getUser;
var updateUser = require('../../lib/utils').updateUser;
var Hand = require('./Hand');

var blackjackAPI = new BaseAPI({
  name: "Blackjack API",
  routePrefix: '/blackjack',
  routeInfo: [
    {
      name: '/blackjack/<user>/hit',
      description: 'Draw another card in an active game'
    },
    {
      name: '/blackjack/<user>/stay',
      description: 'Stop drawing new cards and see if you beat the dealer'
    },
    {
      name: '/blackjack/<user>/split/<total points>',
      description: 'If you draw matching cards, double your bet and play two hands!'
    },
    {
      name: '/blackjack/<user>/double/<total points>',
      description: 'Double your bet, draw one card, and live with the consequences'
    },
    {
      name: '/blackjack/<user>/wager/<total points>/<wagered points>',
      description: 'Place a bet and start a new hand. You can only bet what you can afford'
    },
    {
      name: '/lackjack/<user>/stats',
      description: "See if you're beating the house or it's beating you."
    }
  ],
  init: function init() {
    //this.router.use('/*/:stream/:user', getGameData);
    this.router.get('/hit/:stream/:user', getGameData, hit, wager);
    this.router.get('/double/:stream/:user/:stack', getGameData, double, stay, wager);
    this.router.get('/wager/:stream/:user/:bet', getGameData, wager);
    this.router.get('/stats/:stream/:user', getGameData, stats);
    this.router.get('/stay/:stream/:user', getGameData, stay, wager);
  }
});

module.exports = blackjackAPI;

var WAITING = 0;
var DEALING = 1;
var PLAYING = 2;
var returnRatio = 2

function hit(req, res, next) {
  var responseBlock = '';
  var nextCard;
  var gameData = res.stash.user.gameData.blackjack

  if( !gameData || gameData.state === WAITING) {
    return next();
  }

  nextCard = gameData.deck.drawCard();
  gameData.hand.push(nextCard);
  responseBlock += "You draw: " + nextCard.name  + ". "
  responseBlock += 'Your hand: ' + gameData.hand + '. ';

  switch (gameData.hand.checkHand()) {
    case 0:
      responseBlock += 'Bust! Better luck next time.';
      gameData.state = WAITING;
      gameData.wager = 0;
      gameData.gamesLost++;
      gameData.partsLost += gameData.wager;
      res.stash.user.partsLost += gameData.wager

      break;
    case 1:
      responseBlock += 'You can !hit or !stay';
      gameData.state = PLAYING;

      break;
    case 2:
      responseBlock += "21 is a winner. " + gameData.wager * returnRatio + "Ƥ."
      responseBlock = addPointCmd(gameData.wager * returnRatio, responseBlock);
      gameData.gamesWon++;
      gameData.partsWon += gameData.wager * returnRatio - gameData.wager;
      res.stash.user.partsWon += gameData.wager * returnRatio - gameData.wager;
      gameData.state = WAITING;
      gameData.wager = 0;

      break;
  }

  res.stash.user.gameData.blackjack = gameData;
  updateUser(res.stash.user);

  return res.send(responseBlock);
}

function stay(req, res, next) {
  var user = res.stash.user;
  var gameData = user.gameData.blackjack;

  if(!gameData || !gameData.state || gameData.state === WAITING) {
    return next();
  }

  gameData.hand = new Hand(gameData.hand);
  gameData.dealerHand = new Hand(gameData.dealerHand);
  gameData.deck = new Deck(gameData.deck);
  gameData.dealerHand.push(gameData.deck.drawCard());

  var playerHighVal = gameData.hand.getHighVal();
  var dealerHandVals = gameData.dealerHand.totals();
  var dealerHighVal = gameData.dealerHand.getHighVal();
  var winnings = gameData.wager * returnRatio;
  var responseBlock = res.stash.responseBlock || '';

  responseBlock += " I have " + gameData.dealerHand + '. ';
  dealerPlay(0);
  gameData.wager = 0;
  gameData.state = WAITING;

  user.gameData.blackjack = gameData;

  updateUser(user);

  return res.send(responseBlock);

  function dealerPlay(count) {
    if (dealerHighVal >= 17 && !(dealerHighVal === 17 && dealerHandVals.length > 1)) {
      if(dealerHighVal > playerHighVal) {
        responseBlock += dealerHighVal + ' beats your ' + playerHighVal + '! Tough luck.';
        res.stash.user.partsLost += gameData.wager;
        gameData.partsLost += gameData.wager;
        gameData.gamesLost++;
      } else if (dealerHighVal === playerHighVal){
        responseBlock += 'Push. You break even.';
        responseBlock = addPointCmd(gameData.wager, responseBlock);
        gameData.gamesPushed++;
      } else {
        responseBlock += playerHighVal + ' beats my ' + dealerHighVal + '. You win ' + winnings + 'Ƥ. ';
        responseBlock = addPointCmd(winnings, responseBlock);
        gameData.gamesWon++;
        gameData.partsWon += winnings - gameData.wager;
        res.stash.user.partsWon += winnings - gameData.wager;
      }

      return;
    }

    var nextDealerCard = gameData.deck.drawCard();

    gameData.dealerHand.push(nextDealerCard);
    dealerHandVals = gameData.dealerHand.totals();
    dealerHighVal = gameData.dealerHand.getHighVal();
    responseBlock += 'I hit: ' + nextDealerCard.name + '('+dealerHandVals.join('/')+'). ';

    if(dealerHighVal > 21) {
      responseBlock += 'Bust! You win ' + winnings + 'Ƥ!';
      responseBlock = addPointCmd(winnings, responseBlock);
      gameData.gamesWon++;
      gameData.partsWon += winnings - gameData.wager;
      res.stash.user.partsWon += winnings - gameData.wager;
    } else {
      if(dealerHighVal < 17 || dealerHighVal === 17 && dealerHandVals.length > 1) {
        //HIT CASE
        if(count < 10) {
          dealerPlay(count+1);
        } else {
          responseBlock = "Dealer lost his mind. Here's your money back. Refunded " + gameData.wager + 'Ƥ.';
          responseBlock = addPointCmd(gameData.wager, responseBlock);
        }
      } else {
        //STAY CASE
        responseBlock += 'I stay at ' + dealerHighVal + '. ';

        if(dealerHighVal == playerHighVal) {
          responseBlock += 'Push. You break even.';
          responseBlock = addPointCmd(gameData.wager, responseBlock);
          gameData.gamesPushed++;
        } else if (dealerHighVal > playerHighVal) {
          responseBlock += dealerHighVal + ' beats your ' + playerHighVal + '! Tough luck.';
          gameData.gamesLost++;
          gameData.partsLost += gameData.wager;
          res.stash.user.partsLost += gameData.wager;
        } else {
          responseBlock += playerHighVal + ' beats my ' + dealerHighVal + '. You win ' + winnings + 'Ƥ. ';
          responseBlock = addPointCmd(winnings, responseBlock);
          gameData.partsWon += (winnings - gameData.wager);
          gameData.gamesWon++;
          res.stash.user.partsWon += (winnings - gameData.wager);
        }
      }
    }
  }
}

function double(req, res, next) {
  var gameData = res.stash.user.gameData.blackjack;
  var responseBlock = res.stash.responseBlock || '';
  var currentHand;
  var nextCard;

  if( !gameData || gameData.state === WAITING || !req.params.stack) {
    return next();
  } else if(gameData.state !== DEALING) {
    responseBlock += "It's too late to double down now. You gotta live with your choices. ";
    responseBlock += 'You have ' + gameData.hand + '. ';
    responseBlock += "I'm showing " + gameData.dealerHand + '. ';
    responseBlock += "You can !hit for another card or !stay";

    return res.send(responseBlock);
  }

  if(parseInt(req.params.stack) >= gameData.wager) {
    nextCard = gameData.deck.drawCard();
    gameData.hand.push(nextCard);
    responseBlock += ' ' + removePointCmd(gameData.wager,'') + " Doubling bet. ";
    responseBlock += 'You draw: ' + nextCard.name  + '. ';
    responseBlock += 'Your hand: ' + gameData.hand + '. ';
    gameData.wager *= 2;

    switch (gameData.hand.checkHand()) {
      case 0:
        responseBlock += 'Bust! Good way to lose twice as fast.';
        gameData.state = WAITING;
        gameData.gamesLost++;
        gameData.partsLost += gameData.wager;
        res.stash.user.partsLost += gameData.wager;
        gameData.wager = 0;
        res.stash.user.gameData.blackjack = gameData
        updateUser(res.stash.user);

        return res.send(responseBlock);
      case 1:
        gameData.state = PLAYING;
        res.stash.responseBlock = responseBlock;
        res.stash.user.gameData.blackjack = gameData;

        return next();
      case 2:
        responseBlock += " 21! Looks like that paid off. You win " + gameData.wager*returnRatio+ 'Ƥ!';
        responseBlock = addPointCmd(gameData.wager*returnRatio, responseBlock);
        gameData.state = WAITING;
        gameData.gamesWon++;
        gameData.partsWon += gameData.wager * returnRatio - gameData.wager;
        res.stash.user.partsWon+= gameData.wager * returnRatio - gameData.wager;
        gameData.wager = 0;
        res.stash.user.gameData.blackjack = gameData;
        updateUser(res.stash.user);

        return res.send(responseBlock);
      default:
        res.stash.user.gameData.blackjack = gameData;
        return next();
    }
  } else {
    return res.send("You ain't got the scratch to double up.");
  }
}

function wager(req, res) {
  var gameData = res.stash.user.gameData.blackjack;

  var responseBlock = '';

  if (gameData.state !== WAITING) {
    responseBlock += 'One game at a time, killer! ';
    responseBlock += 'You have ' + gameData.hand + '. ';
    responseBlock += "The dealer's showing " + gameData.dealerHand + '. ';
    responseBlock += "You can !hit " + (gameData.state == DEALING ? ' !stay or !doubledown' : ' or !stay');

    return res.send(addPointCmd(req.params.bet,responseBlock));
  }

  if (!req.params.bet) {
    return res.send("You gotta place a bet to play, kid. This ain't a charity.");
  } else {
    if(gameData.deck.cards.length <= 104) {
      gameData.deck.shuffle();
    }

    gameData.wager = parseInt(req.params.bet);
    gameData.gamesPlayed++;
    gameData.hand = new Hand({_cards:[gameData.deck.drawCard(), gameData.deck.drawCard()]});
    gameData.dealerHand = new Hand();

    if(gameData.hand.checkHand() === 1) {
      gameData.state = DEALING;
      gameData.dealerHand.push(gameData.deck.drawCard());
      responseBlock += 'Your hand: ' + gameData.hand + '. ';
      responseBlock += "I'm showing "  + gameData.dealerHand + '. ';
      responseBlock += "You can !hit for another card" + (gameData.state == DEALING ? ', !stay or !doubledown' : ' or !stay');
    } else {
      var bonus = Math.ceil(gameData.wager*.5);
      responseBlock = 'Your hand is ' + gameData.hand +'. Blackjack! You win ' + gameData.wager * returnRatio+'Ƥ and get a ' + bonus + 'Ƥ bonus!';
      responseBlock = addPointCmd(gameData.wager*returnRatio+bonus,responseBlock);

      res.stash.user.partsWon += gameData.wager * returnRatio + bonus - gameData.wager;
      gameData.partsWon += gameData.wager * returnRatio + bonus - gameData.wager;
      gameData.blackjacks++;
      gameData.state = WAITING;
      gameData.wager = 0;
    }
  }

  res.stash.user.gameData.blackjack = gameData;
  updateUser(res.stash.user);
  return res.send(responseBlock);
}

function stats(req, res) {
  var responseBlock = '';
  var gameData = res.stash.user.gameData.blackjack;

  responseBlock += "You've played " + gameData.gamesPlayed + " hands. With " + gameData.gamesWon + " wins, " + gameData.gamesLost + " losses, " + gameData.gamesPushed + " pushes, and " + gameData.blackjacks + " blackjacks. ";
  responseBlock += "You've won " + gameData.partsWon + "Ƥ and lost " + gameData.partsLost + "Ƥ. ";
  if(gameData.partsWon > gameData.partsLost) {
    responseBlock += "You're up " + (gameData.partsWon - gameData.partsLost) + "Ƥ. ";
  } else {
    responseBlock += "You're down " + (gameData.partsLost - gameData.partsWon) + "Ƥ. ";
  }
  return res.send(responseBlock);
}

function getGameData(req,res,next) {
  getUser(req.params.stream.toLowerCase(), req.params.user.toLowerCase(), function(user){
    if(!user.gameData.blackjack) {
      user.gameData.blackjack = {
        deck: new Deck({shoeSize:6}),
        state: 0,
        wager: 0,
        partsWon: 0,
        partsLost: 0,
        gamesPlayed: 0,
        gamesLost: 0,
        gamesWon: 0,
        gamesPushed: 0,
        blackjacks: 0
      }
    } else {
      user.gameData.blackjack.deck = new Deck(user.gameData.blackjack.deck);
      user.gameData.blackjack.hand = new Hand(user.gameData.blackjack.hand);
      user.gameData.blackjack.dealerHand = new Hand(user.gameData.blackjack.dealerHand);
    }

    res.stash.user = user;
    next();
  });
}

