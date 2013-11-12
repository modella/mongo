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
  var mongo = require('mongoskin').db(url, {w: 1}, function() { });

  return function(Model) {
    var db = mongo.collection(Model.modelName);
    Model.db = db;

    db.open(function(err, col) {
      mquery(Model, db.collection);
      maggregate(Model, db.collection);
    });

    Model.index = db.ensureIndex.bind(db);

    Model.once('initialize', function() {
      for(var attr in Model.attrs) {
        var options = Model.attrs[attr];
        if (options.unique) Model.index(attr, { w: 0, unique: true, sparse: true });
      }
    });

    Model.save = function(cb) {
      var self = this;
      return db.insert(this.toJSON(), function(err, docs) {
        var doc = docs ? docs[0] : null;
        if(err) {
          // Check for duplicate index
          if(err.code == 11000) {
            var attr = err.message.substring(err.message.indexOf('$') + 1, err.message.indexOf('_1'));
            self.error(attr, 'has already been taken');
          }
          return cb(err);
        }
        cb(err, doc);
      });
    };

    Model.update = function(cb) {
      var self = this,
          changed = this.changed();

      //Prevent changing of ID, Mongo will cry.
      if(changed._id) delete changed._id;

      // convert primary to an objectId
      var id = this.primary();
      if(typeof id !== 'object')
        id = db.id(id);

      return db.findAndModify({_id: id}, {$set: changed}, function(err, doc) {
        if(err) {
          // Check for duplicate index
          if(err.code == 11000) {
            var attr = err.message.substring(err.message.indexOf('$') + 1, err.message.indexOf('_1'));
            self.error(attr, 'has already been taken');
          }
          return cb(err);
        }
        cb(err, doc);
      });
    };

    Model.remove = function(cb) {
      var id = this.primary();
      if(typeof id !== 'object')
        id = db.id(id);

      db.remove({_id: id}, function(err) {
        cb(err);
      });
    };

    Model.all = function() {
      var args = Array.prototype.slice.call(arguments),
          fn = args.pop();

      return db.find.apply(db, args).toArray(function(err, users) {
        if(err) return fn(err, null);
        if(users.length === 0) return fn(null, false);
        return fn(null, new Model(users));
      });
    };

    Model.get = function() {
      var args = Array.prototype.slice.call(arguments),
          fn = args.pop(),
          query = args.shift();

      if(typeof query == 'string')
        query = {_id: db.id(query)};
      args.unshift(query);

      args.push(function(err, body) {
        if(err) return fn(err, null);
        if(!body) return fn(null, false);
        return fn(null, new Model(body));
      });

      return db.findOne.apply(db, args);
    };

    Model.removeAll = function() {
      var args = Array.prototype.slice.call(arguments);
      return db.remove.apply(db, args);
    };
  };
};
