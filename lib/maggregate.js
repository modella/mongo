var maggregate = require('maggregate');

module.exports = function(Model, col) {
  Model.aggregate = function(skipWrap) {
    var result = maggregate(col);
    if(!skipWrap) result.wrap(Model);
    return result;
  };
};
