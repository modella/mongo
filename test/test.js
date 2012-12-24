var model = require('node-model');
    mongo = require('../')('localhost/test');

var User = model('user')
  .attr('name')
  .attr('email')
  .attr('password');

User.use(mongo);
