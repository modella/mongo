# mongo

Mongo plugin for [modella](https://github.com/modella/modella). Uses [learnboost/monk](https://github.com/learnboost/monk) for a clean mongo driver.

## Installation

    npm install modella-mongo

## Example

```js
var model = require('modella');
    mongo = require('modella-mongo')('localhost/db');

var User = model('user')
  .attr('_id')
  .attr('name')
  .attr('email', { unique: true })
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
```

## API

By loading this plugin, model inherits:


### model#attr(attr, options)

Adds the `unique` options to valid attr options. Using unique is equivalent to
adding a unique index (see below)

```js
User.attr('username', { unique: true })
    .attr('email'   , { unique: true });
```

### model#index(attr, options)

Index an attribute in mongo.

```js
  User.index('email', { unique : true });
```

## License

MIT
