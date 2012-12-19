
/**
 * Module dependencies.
 */

var noop = function(){};

/**
 * Set up indexes.
 *
 * @param {Object|String|Array} fields
 * @param {Object|Function} optional, options or callback
 * @param {Function} optional, callback
 * @return {Function} self
 * @api public
 */

exports.index = function(fields, opts, fn) {
  this.db.index(fields, opts, fn);
  return this;
};

/**
 * Add validation `fn()`.
 *
 * @param {Function} fn
 * @return {Function} self
 * @api public
 */

exports.validate = function(fn){
  this.validators.push(fn);
  return this;
};

/**
 * Use the given plugin `fn()`.
 *
 * @param {Function} fn
 * @return {Function} self
 * @api public
 */

exports.use = function(fn){
  fn(this);
  return this;
};

/**
 * Define attr with the given `name` and `options`.
 *
 * @param {String} name
 * @param {Object} options
 * @return {Function} self
 * @api public
 */

exports.attr = function(name, options){
  this.attrs[name] = options || {};

  // implied pk
  if ('_id' == name || 'id' == name) {
    this.attrs[name].primaryKey = true;
    this.primaryKey = name;
  }

  // getter / setter method
  this.prototype[name] = function(val){
    if (0 == arguments.length) return this.attrs[name];
    var prev = this.attrs[name];
    this.dirty[name] = val;
    this.attrs[name] = val;
    this.emit('change', name, val, prev);
    this.emit('change ' + name, val, prev);
    return this;
  };

  return this;
};

/**
 * Remove all and invoke `fn(err)`.
 *
 * @param {Function} [fn]
 * @api public
 */

exports.removeAll = function(fn){
  fn = fn || noop;
  var self = this,
      db = this.db;

  db.remove({}, fn);
};

/**
 * Get all and invoke `fn(err, array)`.
 *
 * @param {Function} fn
 * @api public
 */

exports.all = function(fn){
  fn = fn || noop;

  var self = this,
      db = this.db,
      models = [],
      model;

  db.find({}, function(err, docs) {
    if(err) return fn(err);
    else if(!docs) return fn(null, false);
    docs.forEach(function(doc) {
      model = new self(doc);
      model.dirty = {};
      models[models.length] = model;
    });

    fn(null, models);
  });
};

/**
 * Get `query` and invoke `fn(err, model)`.
 *
 * @param {Mixed} query
 * @param {Function} fn
 * @api public
 */

exports.get  =
exports.find = function(query, fn){
  var self = this,
      db = this.db,
      action = 'findOne';

  if('string' == typeof query)
    action = 'findById';

  db[action](query, function(err, doc) {
    if(err) return fn(err);
    else if(!doc) return fn(null, false);
    var model = new self(doc);
    model.dirty = {};
    fn(null, model);
  });
};
