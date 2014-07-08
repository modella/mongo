var modella = require('modella'),
    mongo = require('../')('localhost:27017/modella-mongo'),
    db = require('mongoskin').db('localhost:27017/modella-mongo', {w: 1}),
    mquery = require('mquery'),
    maggregate = require('maggregate'),
    Batch = require('batch'),
    expect = require('expect.js');

var User = modella('User')
  .attr('_id')
  .attr('name')
  .attr('age')
  .attr('email', {unique: true})
  .attr('password');

User.use(mongo);

/**
 * Initialize
 */

var user = new User();

var col = db.collection("User");


describe("Modella-Mongo", function() {
  before(function(done) {
    col.remove({}, done);
  });

  describe("collection", function() {
    it("sets the collection name", function() {
      var Foo = modella('Foo').use(mongo('bar'));
      expect(Foo.db.collection.collectionName).to.be('bar');
    });

    it("sets a default collection name", function() {
      var Baz = modella('Baz').use(mongo);
      expect(Baz.db.collection.collectionName).to.be('Baz');
    });
  });

  describe("sync layer operations", function() {
    it("defines the required sync layer operations", function() {
      expect(User.save).to.be.a('function');
      expect(User.update).to.be.a('function');
      expect(User.remove).to.be.a('function');
    });

    describe("save", function() {
      it("saves the record in the database", function(done) {
        var user = new User({name: 'Ryan', email: 'ryan@slingingcode.com'});
        user.save(function(err, u) {
          expect(user.primary()).to.be.ok();
          col.findOne({}, function(err, u) {
            expect(u).to.be.ok();
            expect(u).to.have.property('name', 'Ryan');
            done();
          });
        });
      });

      it("triggers errors if there is an error", function(done) {
        var user = new User({name: 'Ryan', email: 'ryan@slingingcode.com'});
        user.save();
        user.once('error', function(err) {
          expect(err).to.be.ok();
          done();
        });
      });
    });

    describe("update", function() {
      it("updates an existing record in the database", function(done) {
        var user = new User({name: 'Bob', age: 30});
        user.save(function() {
          user.name('Eddie');
          user.save(function(err, u) {
            expect(err).to.not.be.ok();
            col.findOne({name: 'Eddie'}, function(err, u) {
              expect(u).to.be.ok();
              expect(u).to.have.property('name', 'Eddie');
              expect(u).to.have.property('age', 30);
              done();
            });
          });
        });
      });

      it("doesn't call mongo if nothing changed (needed for mongo 2.6+)", function(done) {
        var user = new User({name: 'Ted'});
        user.save(function() {
          user.name('Ted');
          user.save(function(err) {
            expect(err).to.be(null);
            expect(user.name()).to.be('Ted');
            done();
          });
        });
      });

      it("triggers errors if there is an error", function(done) {
        var user = new User({name: 'Steve Holt'});
        user.save(function(err) {
          expect(err).to.not.be.ok();
          user.email('ryan@slingingcode.com');
          user.save(function(err) {
            expect(err).to.be.ok();
            done();
          });
        });
      });
    });

    describe("remove", function() {
      it("removes an existing record from the database", function(done) {
        var tony = new User({name: 'Tony'});
        tony.save(function() {
          tony.remove(function() {
            col.find({name: 'Tony'}).toArray(function(err, docs) {
              expect(docs).to.have.length(0);
              done();
            });
          });
        });
      });
    });
  });

  describe("additional methods", function() {
    var user;
    before(function(done) {
      var batch = new Batch();
      user = new User({name: 'steven', age: 40});
      batch.push(user.save.bind(user));
      user = new User({name: 'steven', age: 60});
      batch.push(user.save.bind(user));
      user = new User({name: 'steven', age: 20});
      batch.push(user.save.bind(user));
      batch.end(done);
    });

    describe("Model.all", function() {
      it("returns empty array if no records match", function(done) {
        User.all({name: 'brobobski'}, function(err, users) {
          expect(err).to.not.be.ok();
          expect(users).to.be.a(Array);
          expect(users).to.have.length(0);
          done();
        });
      });
      it("returns instances of models", function(done) {
        User.all({name: 'steven'}, function(err, users) {
          expect(err).to.not.be.ok();
          expect(users).to.have.length(3);
          expect(users[0]).to.be.a(User);
          done();
        });
      });
      it("forwards options", function(done) {
        User.all({name: 'steven'}, {limit: 1, sort: {age: -1}}, function(err, users) {
          expect(err).to.not.be.ok();
          expect(users).to.have.length(1);
          expect(users[0].age()).to.be(60);
          done();
        });
      });
    });

    describe("Model.get", function() {
      it("aliases to Model.find", function() {
        expect(User.get).to.be(User.find);
      });
      it("returns false if the model doesn't exist", function(done) {
        User.get({name: 'lsadkfjsadlkf'}, function(err, u) {
          expect(err).to.not.be.ok();
          expect(u).to.not.be.ok();
          done();
        });
      });
      it("returns an instance of the model", function(done) {
        User.get({name: 'steven'}, function(err, u) {
          expect(u).to.be.ok();
          expect(u).to.be.a(User);
          done();
        });
      });
      it("converts a string to an ID", function(done) {
        User.get(user.primary().toString(), function(err, u) {
          expect(u).to.be.ok();
          expect(u).to.be.a(User);
          done();
        });
      });
      it("converts a string in _id to a ID", function(done) {
        User.get({_id: user.primary().toString()}, function(err, u) {
          expect(u).to.be.ok();
          expect(u).to.be.a(User);
          done();
        });
      });

      it("returns false if undefined is passed in", function(done) {
        User.get(undefined, function(err, u) {
          expect(u).to.not.be.ok();
          done();
        });
      });

      it("forwards options", function(done) {
        User.get({name: 'steven'}, {sort: {age: -1}}, function(err, u) {
          expect(u.age()).to.be(60);
          done();
        });
      });
    });

    describe("Model.removeAll", function() {
      before(function(done) {
        var batch = new Batch(),
            user;
        for(var i = 0; i < 5; ++i) {
          user = new User({name: 'soonToBeDeleted'});
          batch.push(user.save.bind(user));
        }
        batch.end(done);
      });
      it("removes all records that match the query", function(done) {
        User.removeAll({name: 'soonToBeDeleted'}, function(err, count) {
          expect(count).to.be(5);
          done();
        });
      });
    });

    describe("Model.query", function() {
      it("returns a new instance of mquery", function() {
        var queryA = User.query(),
            queryB = User.query();
        expect(queryA).to.not.be(queryB);
      });

      it("wraps the mquery methods", function(done) {
        User.query().findOne().where({name: 'steven'}).sort({age: -1}).exec(function(err, u) {
          expect(err).to.not.be.ok();
          expect(u).to.be.a(User);
          expect(u.age()).to.be(60);
          done();
        });
      });
    });

    describe("Model.aggregate", function() {
      it("returns an instance of maggregate", function() {
        expect(User.aggregate()).to.be.a(maggregate);
      });
      it("wraps by default", function(done) {
        User.aggregate().match({name: 'steven'}, function(err, users) {
          expect(users).to.have.length(3);
          expect(users[0]).to.be.a(User);
          done();
        });
      });
      it("lets you skip wrapping", function(done) {
        User.aggregate(true).match({name: 'steven'}).group({_id: '$name', count: {$sum: 1}}).exec(function(err, rep) {
          expect(rep).to.have.length(1);
          expect(rep[0].count).to.be(3);
          done();
        });
      });
    });
  });
});
