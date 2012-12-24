/**
 * Module dependencies
 */

var sync = {};

/**
 * Export `Mongo`
 */

module.exports = function(url) {
  var monk = require('monk')(url);

  return function(model) {
    var db = monk.get(model.modelName);
    model.sync = sync;
    model.db = db;

    // Possibly go with the mixin
    model.index = db.index.bind(db);
  };
};

/**
 * All
 */

sync.all = function(query, fn) {
  if (arguments.length == 1) {
    fn = query;
    query = {};
  }

  this.db.find(query, function(err, models) {
    if (err) return fn(err);
    else if (!models) return fn(null, false);
    return fn(null, models);
  });
};

/**
 * Get
 */

sync.get = function(query, fn) {
  var action = 'findOne';

  if ('string' == typeof query) action = 'findById';

  this.db[action](query, function(err, model) {
    if(err) return fn(err);
    else if(!model) return fn(null, false);
    return fn(null, model);
  });
};

/**
 * removeAll
 */

sync.removeAll = function(query, fn) {
  this.db.remove(query, fn);
};

/**
 * save
 */

sync.save = function(fn) {
  this.model.db.insert(this.attrs, function(err, doc) {
    if(err) return fn(err);
    return fn(err, doc);
  });
};

/**
 * update
 */

sync.update = function(fn) {
  var db = this.model.db,
      id = this.primary(),
      changed = this.changed();

  db.findAndModify({ _id : id }, { $set : changed }, function(err) {
    return fn(err);
  });
};

/**
 * remove
 */

sync.remove = function(query, fn) {
  var db = this.model.db,
      id = this.primary();

  if (arguments.length == 1) {
    fn = query;
    query = { _id : id };
  }

  db.remove(query, function(err) {
    return fn(err);
  });
};
