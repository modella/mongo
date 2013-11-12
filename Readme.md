# Modella-Mongo
[![Build Status](https://api.travis-ci.org/modella/mongo.png)](http://travis-ci.org/modella/mongo) 
[![Coverage
Status](https://coveralls.io/repos/modella/mongo/badge.png)](https://coveralls.io/r/modella/mongo)

Mongo plugin for [modella](https://github.com/modella/modella). Thinly built on
top of [kissjs/node-mongoskin](https://github.com/kissjs/node-mongoskin).

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

user.name('matt');

user.save(function(err) {
  console.log(user.toJSON());
});
```

## Implemented Sync Layer Methods

By adding the plugin, modella 0.2.0 compliant sync layer methods are added. This
enables `instance#save()` and `instance#remove()` to work with mongo.

## API

By loading this plugin, model inherits:

### Model.db

Object pointing to the raw [mongoskin](https://github.com/kissjs/node-mongoskin) database. Use it to manipulate the collection directly.

### Model#index(attr, options)

Index an attribute in mongo.

```js
  User.index('email', { unique : true });
```

Alternatively, you can specify `unique: true` when defining an attribute.

```js
User.attr('username', {unique: true});

// Equivilent to...
User.attr('username');
User.index('username', {unique: true, sparse: true});
```

### Model.all(query, [options], fn)

Queries for all users in the collection that match the given `query`. Additional
options can be passed in (eg. `{sort: {age: -1}}`). 

Calls `fn(err, instances)` where `instances` is an array of Model instances. If
no queries match, `instances` will be `false`.

```js
  User.all({emailConfirmed: true}, {sort: {emailConfirmationDate: 1}}, function(err, users) {
    console.log("Users with confirmed emails: ");
    users.forEach(function(u) {
      console.log(u.username());
    });
  });
```

### Model.get(query, [options], fn)

Queries for one user in the collection that match the given `query`. Additional
options can be passed in (eg. `{sort: {age: -1}}`). 

`query` can also be a string, in which case it will be converted to an
`ObjectId`.

Calls `fn(err, instance)` where `instance` is an instance of Model. If
no queries match, `instance` will be `false`.

```js
  User.get('528263fa996abeabbe000002', function(err, u) {
    console.log(u.username());
  });
```

Calls `fn(err, instances)` where `instances` is an array of Model instances. If
no queries match, instances will be `false`.

### Model.removeAll(query, [options], fn)

Removes all records that match the given `query`.

Calls `fn(err, count)` where `count` is the number of records removed. If
no queries match, instances will be `false`.


```js
  User.removeAll({emailConfirmed: false}, function(err, count) {
    console.log("%d users were deleted", count);
  });
```

### Model.query()

Returns a wrapped instances of `mquery`. See [mquery support](#mquery-support) below.

### Model.aggregate()

Returns a wrapped instances of `maggregate`. See [maggregate support](#maggregate-support) below.


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
