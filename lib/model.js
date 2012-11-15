/**
 * Module dependencies
 */

var monk = require('monk'),
    proto = require('./proto'),
    statics = require('./static'),
    Emitter = require('events').EventEmitter;

/**
 * Export `createModel`
 */

exports = module.exports = createModel;

/**
 * Create a new model constructor with the given `name`.
 *
 * @param {String} name
 * @return {Function}
 * @api public
 */

function createModel(name) {
  if ('string' != typeof name) throw new TypeError('model name required');
  else if(!exports.client) throw new Error('No client to connect to');

  /**
   * Initialize a new model with the given `attrs`.
   *
   * @param {Object} attrs
   * @api public
   */

  function model(attrs) {
    if (!(this instanceof model)) return new model(attrs);
    this._callbacks = {};
    this.attrs = {};
    this.dirty = {};
    if (attrs) this.set(attrs);
  }

  // mixin emitter

  model.__proto__ = Emitter.prototype;

  // statics

  model.modelName = name;
  model.db = exports.client.get(name);
  model.attrs = {};
  model.validators = [];
  for (var key in statics) model[key] = statics[key];

  // prototype

  model.prototype = {};
  model.prototype.model = model;
  model.prototype.__proto__ = Emitter.prototype;
  for (var key in proto) model.prototype[key] = proto[key];

  return model;
}

/**
 * Connect
 */

exports.connect = function(db) {
  exports.client = monk(db);
  return createModel;
};
