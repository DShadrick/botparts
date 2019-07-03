module.exports = {
  getUser: getUser,
  updateUser: updateUser,
  bufferResponse: bufferResponse,
  randomString: randomString,
  init: function(app) {
    responseBufferInit(app);
  },
  addPointCmd: addPointCmd,
  removePointCmd: removePointCmd
};

var MongoClient = require('mongodb').MongoClient
var assert = require('assert');
var _ = require('underscore');
var dbInfo = require('../dbInfo.json').apiDB;

var dbUrl = 'mongodb://'+dbInfo.user+':'+dbInfo.pw+'@localhost:27017/botApi?authMechanism=DEFAULT&authSource=admin';
var responseBuffer = {};
var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
var defaultUser = {
  username: '',
  stream: '',
  parts: 0,
  partsWon: 0,
  partsLost: 0,
  partsSpent: 0,
  gameData: {}
};

function getUser(streamName, name, cb) {
  MongoClient.connect(dbUrl, function(err, db) {
    assert.equal(null, err);
    var collection = db.collection('users');

    collection.findOne({stream: streamName, username: name}, function(err, res){
      db.close();
      if(!res) {
        _createUser(streamName, name, cb)
      } else {
        cb(res);
      }
    });
  });
}

function _createUser(streamName, name, cb) {
  MongoClient.connect(dbUrl, function(err, db) {
    assert.equal(null, err);
    var collection = db.collection('users');
    collection.insert(_.defaults({username: name, stream: streamName}, defaultUser), function(err, res){
      db.close();
      cb(res.ops[0]);
    });
  });
}

function updateUser(user, cb, retries) {
  var retries = retries || 0;
  MongoClient.connect(dbUrl, function(err, db){
    if((err || !db) && retries < 2) {
      updateUser(user, cb, retries++);
      return;
    } else if(err) {
      console.log("Error Saving User: " + user.username);
      cb();
      return;
    }

    var collection = db.collection('users');
    collection.replaceOne({_id: user._id}, user, function(){
      db.close();
      if(cb && typeof cb === 'function') {
        cb();
      }
    });
  });
}

function addPointCmd(val, msg) {
  var val = val || 0;
  var msg = msg || '';
  var commandString = '$addpoints("$user","'+val+'","'+val+'","'+msg+'","Failed to add '+val+' @danparts")';

  return commandString;
}

function removePointCmd(val, msg) {
  var val = val || 0;
  var msg = msg || '';
  var commandString = '$removepoints("$user","'+val+'","'+val+'","'+msg+'","","true")';

  return commandString;
}

function randomString(length) {
  var result = '';
  for (var i = length; i > 0; --i) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }

  return result;
}

function bufferResponse(responseData) {
  if(responseData.length > 255) {
    var responseOverflow = responseData.trim();
    var bufferKey;
    var slicedResponse = [];

    while(responseOverflow.length) {
      slicedResponse.push(responseOverflow.slice(0, 203));
      responseOverflow = responseOverflow.slice(203);
    }

    for(var i = slicedResponse.length - 1; i >= 0; i--) {
      if(bufferKey) {
        slicedResponse[i] += '$readapi(http://api.devshady.com/buffer/' + bufferKey +')';
      }

      bufferKey = randomString(5);
      while(responseBuffer[bufferKey] !== undefined) {
        bufferKey = randomString(5);
      }

      if(i != 0) {
        responseBuffer[bufferKey] = slicedResponse[i];
      }
    }

    return slicedResponse[0];
  } else {
    return responseData;
  }
}

function responseBufferInit(app) {
  app.get('/buffer/:bufferKey', function(req, res) {
    var bufferKey = req.params.bufferKey;
    var response = responseBuffer[bufferKey] || '';

    delete responseBuffer[bufferKey];

    res.send(response);
  });
}
