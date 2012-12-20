var model = require('../').connect('localhost/monk-model'),
    pwd = require('pwd');
    User = model('user');

User.attr('_id')
    .attr('name')
    .attr('email')
    .attr('password')
    .attr('plan');

User.use(hash);

var user = new User();

user.name('jimmy')
    .email('mattmuelle@gmail.com')
    .password('lol')
    .plan('free');

// User.all(function(err, users) {
//   users[1].name('martha');
//   // console.log(users[1].toJSON());
// });

user.save(function(err) {
  console.log(user);
});


function hash(model) {
  model.attr('salt', { required : true });
  model.on('saving', function(obj, done) {
    pwd.hash(obj.password(), function(err, hash) {
      if(err) obj.errors.push(err);
      obj.salt(hash);
      done();
    });
  });
}
