/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs before your Sails app gets lifted.
 * This gives you an opportunity to set up your data model, run jobs, or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.bootstrap.html
 */

var async = require('async');
var _     = require('lodash');

module.exports.bootstrap = function(cb) {
  var indexingStrategy = [
    { collection: Media,    indexing: { user_id:     1, _id:        -1 }},
    { collection: Media,    indexing: { place_id:    1, _id:        -1 }},
    { collection: Like,     indexing: { media_id:    1, user_id:    -1 }, unique: true },
    { collection: Like,     indexing: { user_id:     1, _id:        -1 }},
    { collection: User,     indexing: { full_name:   1, _id:        -1 }},
    { collection: User,     indexing: { fbid:        1                 }, unique: true },
    { collection: Comment,  indexing: { user_id:     1                 }},
    { collection: Comment,  indexing: { media_id:    1, _id:        -1 }},
    { collection: Follower, indexing: { user_id:     1, follower_id: 1 }, unique: true },
    { collection: Follower, indexing: { follower_id: 1, _id:        -1 }},
    { collection: Follower, indexing: { user_id:     1, _id:        -1 }},
    { collection: Tag,      indexing: { media_id:    1                 }},
    { collection: Tag,      indexing: { name:        1, _id:        -1 }},
    { collection: Tag,      indexing: { name:        1, media_id:   -1 }, unique: true },
    { collection: Location, indexing: { place_id:    1                 }, unique: true },
    { collection: Location, indexing: { coordinates: '2dsphere'        }}
  ];

  var taskList = [];
  _.forEach(indexingStrategy, function(value) {
    if (value.unique) {
      taskList.push(function(callback) {
        value.collection.native(function (err, collection) {
          collection.ensureIndex(value.indexing, {unique: true}, callback);
        });
      });
    } else {
      taskList.push(function(callback) {
        value.collection.native(function (err, collection) {
          collection.ensureIndex(value.indexing, callback);
        });
      });
    }
  });

  async.parallel(taskList,cb);
 };
