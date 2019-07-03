module.exports = BaseAPI;

function BaseAPI(properties) {
  if(typeof this.init !== 'function') {
    throw("The init function must be a function. This is day one stuff");
  }

  if(properties.init) {
    this.init = properties.init;
  }

  this.name = properties.name || 'An unnamed API';
  this.routes = properties.routes || [];
  this.routePrefix = properties.routePrefix || '/';
  this.router = require('express').Router();

  return this;
}

BaseAPI.prototype.init = function() {
  console.log("Using default init funciton for " + this.name);
}
