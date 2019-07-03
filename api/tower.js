
var BaseAPI = require('./BaseAPI');
var getUser = require('../lib/utils').getUser;
var updateUser = require('../lib/utils').updateUser;
var addPointCmd = require('../lib/utils').addPointCmd;
var removePointCmd = require('../lib/utils').removePointCmd;

var dayMillis = 24*60*60*1000;
var basicFloors = {
  office: {
    population: [4, 6],
    rent: [100, 300]
  },
  studio: {
    population: [1, 4],
    rent: [200, 500]
  },
  shop: {
    population: [1,2],
    rent: [15, 25]
  }
};

var towerAPI = new BaseAPI({
  name: 'Tower api',
  routePrefix: '/tower',
  routeInfo: [
    {
      name: '/rent/<stream>/<player>',
      description: 'collect daily rent'
    }
  ],
  init: function init() {
    this.router.get('/rent/:stream/:user', getGameData, rent, updateAndRespond);
    this.router.get('/invest/:stream/:user/:amount', getGameData, invest, updateAndRespond);
    this.router.get('/upgrade/:stream/:user/:stack/:floorType?', getGameData, upgrade, updateAndRespond);
    this.router.get('/build/:stream/:user/:floorType?',getGameData, build, updateAndRespond);
    this.router.get('/info/:stream/:user/:floorType?',getGameData, info, updateAndRespond);
  }
});

module.exports = towerAPI;

function rent(req,res,next) {
  var gameData = res.stash.user.gameData.tower;
  var now = new Date().now();

  if((now - lastCollection) > dayMillis) {
    var rent = calcRent();

    res.stash.responseBlock += "You collect " + rent +"Ƥ in rent.";
    gameData.lastCollection = now;
    gameData.totalCollected += rent;
    res.stash.user.partsWon += rent;
    res.stash.user.gameData.tower = gameData;
    res.stash.responseBlock = addPointCmd(rent, responseBlock);
  } else {
    res.stash.responseBlock += "It's not time to collect rent yet. Cool it.";
  }

  next();
}

function invest(req, res, next) {
  var gameData = res.stash.user.gameData.tower;

  gameData.currentInvestment += req.params.amount;
  res.stash.user.partsSpent += req.params.amount;

  if(gameData.currentInvestment < gameData.nextCost) {
    res.stash.responseBlock += (gameData.nextCost - gameData.currentInvestment) + "Ƥ until you can build the next floor.";
  } else {
    res.stash.responseBlock += "You've invested enough to build a new basic floor! Type !towerInfo <floor type> to build a new floor. Basic floors are office, apartment, shop, and resteraunt. Type !floorInfo <floor type> for more information about each."
  }

  res.stash.user.gameData.tower = gameData;
  next();
}

//TODO this is for later times!
function upgrade(req, res, next) {
  var getGame = res.stash.user.gameData.tower;

  next();
}

function build(req, res, next) {
  var gameData = res.stash.user.gameData.tower;

  if(gameData.invested < gameData.nextCost) {
    res.stash.responseBlock += "You haven't got enough parts to build a new floor yet, ya bum.";
  } else if(!req.params.floorType) {
    res.stash.responseBlock += "You gotta tell me what you want to build. I ain't a mind reader."
  } else if (!basicFloors[req.params.floorType]) {
    res.stash.responseBlock += "A " + req.params.floorType + "? Nobody knows what that is, but it's not a part of a building, smart guy. You available choices are: appartment, shop, resteraunt, and office.";
  } else {
    gameData.floors.push(req.params.floorType);
   // gameData.population += calcPop(basicFloors[req.params.roomType].population);
    gameData.currentInvestment -= gameData.nextCost;
    gameData.nextCost = (gameData.floors+1)^2*50;
    res.stash.responseBlock += "Your tower is now " + gameData.floors.length + " floors tall. The population is now " + gameData.population + ".";
    res.stash.responseBlock += " the next floor will cost " + gameData.nextCost + "Ƥ.";
  }

  res.stash.user.gameData.tower = gameData;
  next();
}

function info(req, res, next) {
  var gameData = res.stash.user.gameData.tower;

  next();
}

function getGameData(req, res, next){
  getUser(req.params.stream, req.params.user, function(user){
    if(!user.getGameData.tower) {
      user.getGameData.tower = {
        floors: [],
        totalInvested: 0,
        nextCost: 50,
        lastCollection: new Date().now(),
        totalCollected: 0,
        currentInvestment: 0
      }
    }

    res.stash = res.stash || {};
    res.stash.responseBlock = '';
    res.stash.user = user;
    next();
  });
}

function updateAndRespond(req, res, next) {
  updateUser(res.stash.user);

  res.send(res.stash.responseBlock);
}

function calcRent() {
  return 0;
}
