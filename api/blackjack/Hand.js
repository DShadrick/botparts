module.exports = Hand;

var _ = require('underscore');

function Hand(options){
  this._totals = options && options._totals || [];
  this._cards = options && options._cards || [];
  this._updateTotals();
}

Hand.prototype.totals = function() {
  return this._totals;
}

Hand.prototype.toString = function() {
  return this.printHand()
}

Hand.prototype.printHand = function(hand) {
    var handString = '';
    var cardsToPrint = hand && hand._cards || this._cards;
    var totalsToPrint = hand && hand._totals || this._totals;

    handString += _.map(cardsToPrint, function(card) {
      return card.name;
    }).join(' ') + '('+totalsToPrint.join('/')+')';

    return handString;
}

Hand.prototype.checkHand = function() {
  for(var i = 0; i < this._totals.length; i++) {
    if (this._totals[i] === 21) {
      return 2;
    }
  }

  if(this._totals[0] > 21) {
    return 0;
  } else {
    return 1;
  }
}

Hand.prototype.cards = function() {
  return this._cards;
}

Hand.prototype._updateTotals = function() {
  this._totals = [];
  for(var i = 0; i < this._cards.length; i++) {
    if(!this._totals.length) {
      if(this._cards[i].value === 1) {
        this._totals.push(11);
      }

      this._totals.push(this._cards[i].value > 10 ? 10 : this._cards[i].value);
    } else {
      for(var j = this._totals.length - 1; j >= 0; j--) {
        if(this._cards[i].value === 1) {
          this._totals.push(this._totals[j] + 11);
        }

        this._totals[j] += (this._cards[i].value > 10 ? 10 : this._cards[i].value);
      }
    }
  }

  this._totals = _.uniq(this._totals)

  this._totals.sort(function(a, b){
    return a < b;
  });

  if(this._totals.length > 1) {
    var tempTotals = this._totals;

    this._totals = this._totals.filter(function(num){
      return num <= 21;
    });

    if(this._totals.length === 0) {
      this._totals = [tempTotals.pop()];
    } else if (this._totals[0] === 21) {
      this._totals = [21];
    }
  }
}

Hand.prototype.push = function(card) {
  this._cards.push(card);
  this._updateTotals();
}

Hand.prototype.getHighVal = function() {
  return this._totals[0];
}
