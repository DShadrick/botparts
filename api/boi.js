var request = require('request');
var cheerio = require('cheerio');
var _ = require('underscore');
var async = require('async');
var BaseAPI = require('./BaseAPI');
var bufferResponse = require('../lib/utils').bufferResponse;
var MongoClient = require('mongodb').MongoClient
var assert = require('assert');
var dbInfo = require('../dbInfo.json').apiDB;
var dbUrl = 'mongodb://'+dbInfo.user+':'+dbInfo.pw+'@localhost:27017/botApi?authMechanism=DEFAULT&authSource=admin';

var isaacAPI = new BaseAPI({
  name: 'Binding of Isaac API',
  routePrefix: '/boi',
  routeInfo: [
    {
      name: '/boi/item/<item name>',
      description: 'Returns the functionality of a given item'
    },
    {
      name: '/boi/count',
      description: 'returns the number of items currently accounted for'
    }
  ],
  init: function init() {
    loadData();

    this.router.get('/item/:itemName', lookupItem);
    this.router.get('/refresh', function(req, res){
      loadData();
      res.send('Items reloaded');
    });
    this.router.get('/count', function(req, res) {
      res.send('$user, there are currently ' + itemCount + ' items loaded.');
    });
  }
});

module.exports = isaacAPI;

var isaacItems = {}
var itemCount = 0;

function loadData() {
  itemCount = 0;
  async.parallel([
    getItems,
    getTrinkets,
    getCards,
    getPills
  ], function(error, results){
    if(error) {
      console.log(error);
    }

    MongoClient.connect(dbUrl, function(err, db) {
      assert.equal(null, err);

      var collection = db.collection('boiItems');

      _.each(results, function(itemSet){
        _.each(itemSet, function(item){
          var itemKey = formatItemKey(item.name);

          itemCount++;
          collection.findAndModify({itemKey: itemKey}, [['itemKey', 1]], _.extend({itemKey: itemKey}, item), {upsert: true});
        });
      });

      db.close();
    });
  });
}

function formatItemKey(key) {
  var aliases = [
    {
      query: /^little /,
      replacement: 'lil ',
    },
    {
      query: /^the /,
      replacement: '',
    },
    {
      query: /['()]/g,
      replacement: '',
    }
  ];

  key = key.trim().toLowerCase();

  for(var i = 0; i < aliases.length; i++) {
    key = key.replace(aliases[i].query, aliases[i].replacement);
  }

  return key;
}

function getItems(callback) {
  request({
    uri: 'http://bindingofisaacrebirth.gamepedia.com/item'
  }, function(error, response, body){
    if(error) {
      console.log('Failed to load items');
      console.log(error);
      callback(null, 0);
    } else {
      var $ = cheerio.load(body);
      var itemContainers = $('[class*=-collectible] tr');
      var items = [];

      _.each(itemContainers, function(item) {
        var $itemTds = $(item).find('td');
        var itemData = {};

        if(!$itemTds.length) {
          return;
        }

        itemData.name = $itemTds.eq(0).text();
        itemData.description = $itemTds.eq(4).text();

        if($itemTds.eq(5).text()) {
          itemData.description += ' Recharge: ' + $itemTds.eq(5).text();
        }

        items.push(itemData);
      });

      callback(null, items);
    }
  });
}

function getTrinkets(callback) {
 request({
   uri: 'http://bindingofisaacrebirth.gamepedia.com/trinkets'
 }, function(error, response, body){
   if(error) {
     console.log(error);
     console.log('Failed to load Trinkets');
     callback(null, 0);
   } else {
     var $ = cheerio.load(body);
     var itemContainers = $('.trinkets tr');
     var items = [];

     _.each(itemContainers, function(item) {
       var $itemTds = $(item).find('td');
       var itemData = {};

       if(!$itemTds.length){
        return;
       }

       itemData.name = $itemTds.eq(0).text();
       itemData.description = $itemTds.last().text();
       items.push(itemData);
     });

     callback(null, items);
   }
 });
}

function getCards(callback) {
 request({
   uri: 'http://bindingofisaacrebirth.gamepedia.com/Cards_and_Runes'
 }, function(error, response, body){
   if(error) {
     console.log('Failed to load Cards/Runes');
     console.log(error);
     callback(null,0);
   } else {
     var $ = cheerio.load(body);
     var itemContainers = $('.wikitable tr');
     var items = [];

     _.each(itemContainers, function(item) {
       var $itemTds = $(item).find('td');
       var itemData = {};

       if(!$itemTds.length) {
        return;
       }

       itemData.name = $itemTds.eq(0).text();
       itemData.description = $itemTds.last().text();
       items.push(itemData);
     });

     callback(null, items);
   }
 });
}

function getPills(callback) {
 request({
   uri: 'http://bindingofisaacrebirth.gamepedia.com/pills'
 }, function(error, response, body){
   if(error) {
     console.log('Failed to load Pills');
     console.log(error);
     callback(null, 0);
   } else {
     var $ = cheerio.load(body);
     var itemContainers = $('.wikitable tr > td:nth-child(1):not([style])');
     var items = [];

     itemContainers = itemContainers.map(function(){
      return $(this).parent();
     });

     _.each(itemContainers, function(item) {
       var $itemTds = $(item).find('td');
       var itemData = {};

       if(!$itemTds.length) {
        return;
       }

       itemData.name = $itemTds.eq(0).text().trim();
       itemData.description = $itemTds.last().text().trim();

       items.push(itemData);
       //isaacItems[formatItemKey(itemData.name)] = itemData;
     });

     callback(null, itemContainers.length);
   }
 });
}

function lookupItem(req,res){
  var key = formatItemKey(req.params.itemName)
  var responseBlock = '';
  var suggestion = '';

  if(key === "") {
    return res.send("You must specify the name of the item you would like to know about.");
  }

  MongoClient.connect(dbUrl, function(err, db) {
    var collection = db.collection('boiItems');

    collection.findOne({itemKey: key}, function(err, item){
      if(item) {
        responseBlock += item.name + ": ";
        responseBlock += item.description;
        db.close()
        res.send(bufferResponse(responseBlock));
      } else {
        collection.find({$text: {$search: key}}).toArray(function(err, suggestedItems){
          responseBlock = "I couldn't find \"" +req.params.itemName+'\"';
          if(suggestedItems.length) {
            if(suggestedItems.length > 1) {
              suggestedItems[suggestedItems.length -1].name = 'or ' + suggestedItems[suggestedItems.length - 1].name
            }

            suggestion = _.map(suggestedItems, function(item){return item.name}).join(', ');
            responseBlock += suggestion.length ? (" Did you mean one of these? " + suggestion) : '';
          }
          db.close()
          res.send(bufferResponse(responseBlock));
        });
      }
    });
  });
}
