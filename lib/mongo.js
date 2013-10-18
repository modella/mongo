/**
 * Module dependencies
 */

var debug = require('debug')('modella:mongo'),
    mquery = require('./mquery'),
    maggregate = require('./maggregate'),
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

    Model.index = db.index.bind(db);
    mquery(Model, db.col);
    maggregate(Model, db.col);

    Model.once('initialize', function() {
      for(var attr in Model.attrs) {
        var options = Model.attrs[attr];
        if (options.unique) Model.index(attr, { unique: true, sparse: true } );
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

  fixQuery.call(this, query);

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
  if ('string' == typeof query)
    action = 'findById';
  else
    fixQuery.call(this, query);

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
  fixQuery.call(this, query);
  this.db.remove(query, fn);
};

/**
 * save
 */

sync.save = function(fn) {
  var json = this.toJSON(),
      self = this;

  debug('saving... %j', json);
  fixQuery.call(this, json);
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

  var sid;
  if(typeof id.toHexString == 'function')
    sid = id.toHexString();
  else
    sid = id;

  changed = fixQuery.call(this, changed);

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
  var sid;
  if(typeof id.toHexString == 'function')
    sid = id.toHexString();
  else
    sid = id;

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

function fixQuery(query) {
  // Fix monk's query casting
  var Model;
  if(this.model)
    Model = this.model;
  else
    Model = this;

  for(var key in query) {
    if(Model.attrs[key] && Model.attrs[key].references) {
      if(query[key].toHexString)
        query[key] = query[key].toHexString();
      query[key] = Model.db.id(query[key]);
    }
  }

  return query;
}
