module.exports = Deck;

function Deck(options = {}) {
  this.shoeSize = options.shoeSize || 1;
  this.cards = options.cards || [];

  if(!this.cards.length) {
    this.shuffle();
  }
}

Deck.prototype.shuffle = function() {
  for(var i = 0; i < 52 * this.shoeSize; i++) {
    this.cards.push(i);
  }
}

Deck.prototype.drawCard = function(index) {
  var cardIndex = index !== undefined ? index : Math.floor(Math.random() * this.cards.length);
  var cardId = this.cards.splice(cardIndex, 1);

  return resolveCard(cardId);
}

Deck.prototype.remainingCards = function () {
  return this.cards.length;
}

function resolveCard(id) {
  id = parseInt(id, 10);
  var suits = ['♥','♣','♦','♠'];
  var card = {
    suitId: id !== id ? -1 : Math.floor(id / 13) % 4,
    value: id !== id ? 0 : (id % 13) + 1,
    name: ''
  }

  switch (card.value) {
    case 0:
      card.name = 'Joker';
      break;
    case 1:
      card.name = 'A' + suits[card.suitId];
      break;
    case 11:
      card.name = 'J' + suits[card.suitId];
      break;
    case 12:
      card.name = 'Q' + suits[card.suitId];
      break;
    case 13:
      card.name = 'K' + suits[card.suitId];
      break;
    default:
      card.name = card.value.toString() + suits[card.suitId];
  }

  return card;
}
