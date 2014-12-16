'use strict';
/**
 * Module dependencies
 */

var debug = require('debug')('modella:mongo'),
    mongoskin = require('mongoskin'),
    mquery = require('./mquery'),
    maggregate = require('./maggregate'),
    sync = {};

// CONSTANTS

var FLOAT_REGEXP = /[0-9]*\.[0-9]*/;
var SCIENTIFIC_REGEXP = /[0-9.]+e[0-9]+/;

var URL_REGEXP = /^mongodb:\/\//;
/**
 * Export `Mongo`
 */

module.exports = function(url) {
  if (!URL_REGEXP.test(url)) {
    url = 'mongodb://' + url;
  }
  var mongo = mongoskin.db(url, {w: 1}, function() { });

  function plugin(collection, Model) {
    var db = mongo.collection(collection);

    db.open(function(err) {
      if (err) throw err;
      mquery(Model, db._native);
      maggregate(Model, db._native);
      Model.db = db;
      db.collection = db._native;
      db.id = mongoskin.ObjectID;
    });

    Model.index = db.ensureIndex.bind(db);

    Model.prototype.oldAtomics = {};

    Model.on('change', function(instance, name, value, previous) {
      var options = Model.attrs[name];
      if (options.atomic && instance.oldAtomics[name] === undefined) {
        instance.oldAtomics[name] = previous;
      }
    });

    Model.once('initialize', function() {
      var indexCb = function(err) {
        if (err) throw err;
      };
      for(var attr in Model.attrs) {
        if (Model.attrs.hasOwnProperty(attr)) {
          var options = Model.attrs[attr];
          if (options.unique) Model.index(attr, { w: 0, unique: true, sparse: true }, indexCb);
        }
      }
    });

    // will always be looking for _id
    Model.prototype.isNew = function() {
      return ! this.has('_id');
    };

    Model.save = function(cb) {
      var self = this;
      var jsonDoc = this.toMongo ? this.toMongo() : this.toJSON();
      Object.keys(jsonDoc).forEach(function(attr) {
        var options = Model.attrs[attr];
        // check for typoes that need to be parsed from strings into
        // an object now that modella is recursively calling toJSON
        if (options.type) {
          if (options.type === 'date' || options.type === Date) {
            if ('string' === typeof jsonDoc[attr]) {
              jsonDoc[attr] = new Date(jsonDoc[attr]);
            }
          }
          if (options.type === mongoskin.ObjectID || options.type === 'ObjectId' || options.type === 'ObjectID') {
            if ('string' === typeof jsonDoc[attr]) {
              jsonDoc[attr] = db.id(jsonDoc[attr]);
            }
          }
        }
      });
      return db.insert(jsonDoc, function(err, docs) {
        var doc = docs ? docs[0] : null;
        if(err) {
          // Check for duplicate index
          if(err.code === 11000) {
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
      var id = this._id();
      if(typeof id !== 'object')
        id = db.id(id);

      if(Object.keys(changed).length === 0) { return cb(null, this._attrs); }

      // set up empty update document
      var updateDoc = {
      };

      // loop through each changed key to see if it has been configured as "atomic"
      Object.keys(changed).forEach(function(changedKey) {
        var options = Model.attrs[changedKey];

        if (options.atomic) {
          // if atomic, try parsing it as a number
          var numString = changed[changedKey].toString();
          var number = NaN;
          // detect float strings
          if (FLOAT_REGEXP.test(numString) || SCIENTIFIC_REGEXP.test(numString)) {
            number = parseFloat(numString);
          } else {
            // assume base 10?
            number = parseInt(numString, 10);
          }
          // if not actually a number return an error
          if (isNaN(number)) {
            var errorString = "Atomic property " + changedKey + " set to NaN";
            self.error(changedKey, errorString);
          }
          // get the old value of the atomic variable is available
          if (self.oldAtomics[changedKey] !== undefined) {
            // get the difference and update the $inc doc on the updateDoc
            var delta = number - self.oldAtomics[changedKey];
            if (!updateDoc.$inc) updateDoc.$inc = {};
            updateDoc.$inc[changedKey] = delta;
          } else {
            // if there is no old value, just $set it
            if (!updateDoc.$set) updateDoc.$set = {};
            updateDoc.$set[changedKey] = number;
          }
          // set the old atomic value to the new value
          self.oldAtomics[changedKey] = changed[changedKey];
        } else if (self.unsetAttrs[changedKey] === true) {
          if (!updateDoc.$unset) updateDoc.$unset = {};
          updateDoc.$unset[changedKey] = "";
          delete self.unset[changedKey];
        } else {
          // check for certain types to see if we need to convert from strings before updating
          if (options.type) {
            if (options.type === 'date' || options.type === Date) {
              if ('string' === typeof changed[changedKey]) changed[changedKey] = new Date(changed[changedKey]);
            }
            if (options.type === mongoskin.ObjectID || options.type === 'ObjectId' || options.type === 'ObjectID') {
              if ('string' === typeof changed[changedKey]) changed[changedKey] = db.id(changed[changedKey]);
            }
          }
          if (!updateDoc.$set) updateDoc.$set = {};
          updateDoc.$set[changedKey] = changed[changedKey];
        }
      });

      if (self.errors.length) return cb(new Error(self.errors[0].message));

      return db.findAndModify({_id: id}, {}, updateDoc, {new: true}, function(err, doc) {
        if(err) {
          // Check for duplicate index
          // test for qwirks/different mongo versions
          if (!err.code) err.code = err.lastErrorObject.code;
          if(err.code === 11000 || err.code === 11001) {
            var attr = err.message.substring(err.message.indexOf('$') + 1, err.message.indexOf('_1'));
            self.error(attr, 'has already been taken');
          }
          return cb(err);
        }
        cb(err, doc);
      });
    };

    Model.remove = function(cb) {
      var id = this._id();
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
        if(users.length === 0) return fn(null, users);
        return fn(null, new Model(users));
      });
    };

    Model.find = Model.get = function() {
      var args = Array.prototype.slice.call(arguments),
          fn = args.pop(),
          query = args.shift();

      if(!query) return fn(null, false);

      if(typeof query === 'string' || typeof query === 'number') {
        var pk = this.primaryKey
        var obj = {};
        obj[pk] = query;
        obj[pk] = pk == '_id' ? db.id(query) : obj[pk];
        query = obj;
      }else{
        convertStringToIds(query);
      }
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

    function convertStringToIds(query) {
      if(typeof query === 'object' && query._id && typeof query._id === 'string')
        query._id = db.id(query._id);
    }
  }

  // Use alternate collection name, defaults to modelName
  var useFunction =  function(Model) {
    return ('string' === typeof Model) ? plugin.bind(null, Model) : plugin(Model.modelName, Model);
  };

  useFunction.ObjectID = mongoskin.ObjectID;
  useFunction.ObjectId = mongoskin.ObjectID;

  return useFunction;

};
