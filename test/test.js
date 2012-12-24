var model = require('node-model');
    mongo = require('../')('localhost/model-mongo');

var User = model('user')
  .attr('_id')
  .attr('name')
  .attr('email')
  .attr('password');

User.use(mongo);

/**
 * Initialize
 */

var user = new User;

user.name('matt')
    .email('mattmuelle@gmail.com')
    .password('test');

user.save(function(err) {
  console.log(user.toJSON());
});
