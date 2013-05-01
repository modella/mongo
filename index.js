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

  return function(Model) {
    var db = monk.get(Model.modelName);
    Model._sync = sync;
    Model.db = db;

    // Possibly go with the mixin
    Model.index = db.index.bind(db);

    Model.once('initialize', function() {
      for(var attr in Model.attrs) {
        var options = Model.attrs[attr];
        if (options.unique) Model.index(attr, { unique: true } );
      }
    });
  };
};

/**
 * Sync Name
 */

sync.name = 'mongo';

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
  var json = this.toJSON(),
      self = this;

  debug('saving... %j', json);
  this.model.db.insert(json, function(err, doc) {
    if(err) {
      // Check for duplicate index
      if(err.code == 11000) {
        var attr = err.message.substring(err.message.indexOf('$') + 1, err.message.indexOf('_1'));
        self.error(attr, 'has already been taken');
      }
      return fn(err);
    }
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
      self = this,
      changed = this.changed();

  // Mongo won't let you modify _id, even if it's the same
  if(changed._id) delete changed._id;

  // TODO: understand why this needs to be .toString()
  // With ObjectId, you get incredibly strange bugs with compiled BSON
  // in mongo >= 2.0.8 the line. If _id is object in mongodb node_module
  // when go to execute, it will give { BSONElement: bad type }
  var sid = id.toString();

  debug('updating %s and settings %j', id, changed);
  db.findAndModify({ _id : sid }, { $set : changed }, function(err, doc) {
    if(err) {
      if(err.lastErrorObject.code == 11001) {
        var attr = err.message.substring(err.message.indexOf('$') + 1, err.message.indexOf('_1'));
        self.error(attr, 'has already been taken');
      }
      return fn(err);
    }
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

  // same reason as above, this time it closes the connect
  // [Error: connection closed]
  var sid = id.toString();

  if (arguments.length == 1) {
    fn = query;
    query = { _id : sid };
  }

  debug('removing %j', query);
  db.remove(query, function(err) {
    if(err) return fn(err);
    debug('removed');
    return fn();
  });
};
