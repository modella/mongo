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

## A Note about connection usage

Each call to `modella-mongo` will open up a mongo connection, and return a function that can be used as a plugin for ANY Modella model. 

As such it is recommended that you export the result of `modella-mongo` and then use that for all of your models.

#### Example using too many connections

##### models/user.js
```js
...
var mongo = require('modella-mongo')('localhost/my-db');
User.use(mongo);
...
```

##### models/post.js
```js
...
var mongo = require('modella-mongo')('localhost/my-db');
Post.use(mongo);
...
```
In the above example both the `User` and `Post` model will open a connection to the mongo database.


#### Example of better way

##### config/modella-db.js
```js
var mongo = module.exports = require('modella-mongo')('localhost/my-db');
```

##### models/user.js
```js
...
var configuredDb = require('../config/modella-db');
User.use(configuredDb);
...
```

##### models/post.js
```js
...
var configuredDb = require('../config/modella-db');
Post.use(configuredDb);
...
```

Here `modella-db.js` configures the mongo database,  and then both models use it.

## License

MIT
