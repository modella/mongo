var mquery = require('mquery');

module.exports = function(Model, collection) {
  var queryWrapper = buildQueryWrapper(Model, collection);

  Model.query = function() {
    return queryWrapper;
  };
};

function buildQueryWrapper(Model, collection) {
  var queryWrapper = new mquery(collection);

  var wrappedMethods = ['find', 'findOne', 'update', 'findOneAndUpdate',
    'findOneAndRemove', 'distinct'];

  wrappedMethods.forEach(function(method) {
    var oldMethod = queryWrapper[method];
    queryWrapper[method] = function() {
      var args = Array.prototype.slice.call(arguments),
          cb = args[args.length - 1];

      if(typeof cb == 'function') {
        args[args.length - 1] = function(err, doc) {
          if(err) cb(err, null);
          else if(!doc) cb(err, doc);
          else {
            var instances = new Model(doc);
            cb(null, instances);
          }
        };
      }
      return oldMethod.apply(queryWrapper, args);
    };
  });
  return queryWrapper;
}
