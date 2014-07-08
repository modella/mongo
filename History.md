
0.2.10 / 2014-07-08 
==================

 * fix bug where non-changing models would cause all attrs to be undefined

0.2.9 / 2014-07-07 
==================

 * add bug fix for saving unchanged models when nothing changed on mongo 2.6+

0.2.8 / 2014-03-08 
==================

 * fix Model.query() not returning new instances of mquery [closes #8]

0.2.7 / 2013-12-31 
==================

 * Made it so passing undefined in to get/find will not return a model

0.2.6 / 2013-11-24 
==================

 * Switched back to Mongoskin official

0.2.5 / 2013-11-23 
==================

 * Temporary re-point mongoskin to version pinned version

0.2.4 / 2013-11-22 
==================

 * Added conversion of _id strings to proper Id for find/get

0.2.3 / 2013-11-14 
==================

 * Fixed an issue where on update we weren't returning the new attrs
 * Rely on Mquery for MongoDb Dependency

0.2.2 / 2013-11-13 
==================

 * Fixed update and update test

0.2.1 / 2013-11-13 
==================

 * Updated API to be more similar to pre-0.2.0
 * Updated devDependency version pinning on package.json

0.2.0 / 2013-11-12 
==================

 * Modella 0.2.0 Support

0.1.4 / 2013-10-18 
==================

 * Added maggregate support

0.1.3 / 2013-10-11 
==================

  * Implemented mquery support

0.1.2 / 2013-10-02 
==================

  * Added sparse indexing to unique options in modella

0.1.1 / 2013-06-05 
==================

 * More fixes for BSON Errors

0.1.0 / 2013-06-05 
==================

 * Added references option to  auto-cast object IDs

0.0.12 / 2013-05-01 
==================
  * Fixed unique errors not showing up on update

0.0.11 / 2013-04-18 
==================

  * Added errors to modella fields on unique being taken

0.0.10 / 2013-04-03 
==================

  * Merge pull request #1 from rschmukler/master
  * Merge branch 'master' of https://github.com/modella/mongo
  * Release 0.0.9
  * Added unique processing to attr
  * Re-Updated to work with modella version v0.1.0

0.0.9 / 2013-03-22
==================

  * moved to modella-mongo

0.0.8 / 2013-03-05
==================

  * fixed example
  * added sync layer name

0.0.7 / 2013-03-03
==================

  * Fixed remove

0.0.6 / 2013-03-02
==================

  * fixed incredibly obscure bug

0.0.5 / 2013-02-05
==================

  * removed to string stuff

0.0.4 / 2013-02-05
==================

  * casting: in= string=>objectid, out= objectid=>string
  * added debug
  * updated save

0.0.3 / 2012-12-28
==================

  * added options object


0.0.2 / 2012-12-28
==================

  * don't update _id

0.0.1 / 2010-01-03
==================

  * Initial release
