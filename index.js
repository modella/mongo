/**
 * Module dependencies
 */

var debug = require('debug')('modella:mongo'),
    sync = {};

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

sync.all = function(query, options, fn) {
  if (arguments.length == 1) {
    fn = query;
    options = {};
    query = {};
  } else if (arguments.length == 2) {
    fn = options;
    options = {};
  }

  debug('getting all %j with options %j', query, options);
  this.db.find(query, options, function(err, models) {
    if (err) return fn(err);
    else if (!models) return fn(null, false);
    var model;

    debug('got all models %j', models);
    return fn(null, models);
  });
};

/**
 * Get
 */

sync.get = function(query, options, fn) {
  var db = this.db;

  if(arguments.length == 2) {
    fn = options;
    options = {};
  }

  var action = 'findOne';
  if ('string' == typeof query) action = 'findById';

  debug('getting %j using %s with %j options...', query, action, options);
  db[action](query, options, function(err, model) {
    if(err) return fn(err);
    else if(!model) return fn(null, false);
    debug('got %j', model);
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
  var json = this.toJSON();
  debug('saving... %j', json);
  this.model.db.insert(json, function(err, doc) {
    if(err) return fn(err);
    debug('saved %j', doc);
    return fn(null, doc);
  });
};

/**
 * update
 */

sync.update = function(fn) {
  var db = this.model.db,
      id = this.primary(),
      changed = this.changed();

  // Mongo won't let you modify _id, even if it's the same
  if(changed._id) delete changed._id;

  // convert string id to objectid
  id = db.id(id);

  debug('updating %s and settings %j', id, changed);
  db.findAndModify({ _id : id }, { $set : changed }, function(err, doc) {
    if(err) return fn(err);
    debug('updated %j', doc);
    fn();
  });
};

/**
 * remove
 */

sync.remove = function(query, fn) {
  var db = this.model.db,
      id = this.primary();

  // convert string id to objectid
  id = db.id(id);

  if (arguments.length == 1) {
    fn = query;
    query = { _id : id };
  }

  debug('removing %j', query);
  db.remove(query, function(err) {
    if(err) return fn(err);
    debug('removed');
    return fn();
  });
};
