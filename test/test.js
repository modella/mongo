var model = require('../').connect('localhost/monk-model'),
    User = model('user');

User.attr('_id')
    .attr('name')
    .attr('email')
    .attr('password')
    .attr('plan');

var user = new User();

user.name('jimmy')
    .email('mattmuelle@gmail.com')
    .password('lol')
    .plan('free');

User.all(function(err, users) {
  users[1].name('martha');
  console.log(users[1].toJSON());
});

