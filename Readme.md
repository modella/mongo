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

## mquery support

`modella-mongo` provides a wrapped version of the wonderful [mquery](https://github.com/aheckmann/mquery) 
query builder. To get it, simply call `Model.query()`.
This allows you to build readable and robust queries easily. When approprirate,
modella-mongo will return instances of `modella` models, instead of just
documents. Aside from that, it follows the `mquery` API completely.

### Example with mquery

```js
  User.query().findOne().where({username: 'Bob'}).exec(function(err, u) {
    u.username() // => 'Bob'
  });
```

## maggregate support

`modella-mongo` uses the [maggregate](https://github.com/rschmukler/maggregate) 
aggregation builder. To use it, simply call `Model.aggregate()`.

This allows you to build readable aggregations easily. By default it wraps
responses in `Model` instances, but can be disabled by passing `skipWrap` as
`true`. It also follows the `maggregate` api completely.

### Example with maggregate

```js
var skipWrapping = true;
User.aggregate(skipWrapping).group({_id: '$location', locationCount: {$sum: 1}}, function(err, res) {
  res.forEach(function(loc) {
    console.log("In location %s there are %d users", loc._id, loc.locationCount);
  });
});
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
