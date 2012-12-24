
# model-mongo

Mongo plugin for `matthewmueller/model`, based on `component/model`. Uses `learnboost/monk` to for a clean mongo driver.

## Example

```js
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
```

## License

(The MIT License)

Copyright (c) 2012 matt mueller &lt;mattmuelle@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
