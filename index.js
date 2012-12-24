/**
 * Export `Monk`
 */

module.exports = function(url) {
  var monk = require('monk')(url);

  return function(model) {
    var db = monk.get(model.modelName);
    var sync = new Sync(db);
    model.sync = sync;

    // Possibly go with the mixin
    model.index = db.index.bind(db);
  };
};

/**
 * Initialize `Sync`
 */

function Sync(db) {
  this.db = db;
}

/**
 * All
 */

Sync.prototype.all = function(query, fn) {

};

/**
 * Get
 */

Sync.prototype.get = function(query, fn) {

};

/**
 * removeAll
 */

Sync.prototype.removeAll = function(query, fn) {

};

/**
 * save
 */

Sync.prototype.save = function(query, fn) {

};

/**
 * update
 */

Sync.prototype.update = function(query, fn) {

};

/**
 * remove
 */

Sync.prototype.remove = function(query, fn) {

};
