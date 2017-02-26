module.exports = {

  isOwner: function(media_id, user_id, callback) {
    Media.findOne({ where: { id: media_id }, select: ['user_id'] }).exec(function(err, ret) {
      if (err || !ret) return callback(err);
      callback(null, ret.user_id === user_id);
    });
  },

  getOneMedia: function(media_id, options, callback) {
    var options = { pagination: { count: 1 } }
    MediaService.getMedias({id: media_id}, options, function(err, medias) {
      if (err) {
        return callback(err);
      }

      var media = null;
      if (medias && medias.length > 0) {
        media = medias[0];
      }

      callback(null, media);
    });
  },

  getMediasByUser: function(user_id, options, callback) {
    MediaService.getMedias({ user_id: user_id }, options, callback);
  },

  updateOne: function(user_id, params, callback) {
    var self = this;
    async.auto({
      isOwner: function(next) {
        self.isOwner(params.id, user_id, next);
      },
      location: function(next) {
        LocationService.findOrCreate({place_id: params.place_id}, next);
      },
      update: ['isOwner', function(ret, next) {
        if (!ret.isOwner) return next(null, null);
        Media.update({ id: params.id }, _.pick(params, ['caption', 'place_id', 'is_comment_off', 'tag_users']), next);
      }],
      updateTags: ['update', function(ret, next) {
        if (_.isEmpty(ret.update)) return next(null, null);
        TagService.updateTags(ret.update[0], null, next);
      }],
      reload: ['updateTags', function(ret, next) {
        if (_.isEmpty(ret.update)) return next(null, null);
        self.getOneMedia(ret.update[0].id, {}, next);
      }],
    }, function(err, ret) {
      if (err || !ret.reload) {
        return callback(err);
      }
      if (!('location' in ret.reload)) {
        ret.reload.location = ret.location;
      }
      callback(null, ret.reload);
    });
  },

  cacheComment: function(comment) {
    if (!comment.media_id) return;
    Media.findOne({ id: comment.media_id }).exec(function (err, result) {
      if (err || !result) return;
      var list = _.get(result, 'comments.list', []);
      if (_.size(list) >= 2) {
        list.shift();
      }
      list.push(comment.id);
      Media.update({id: comment.media_id}, { comments: { list: list } }, function(){});
    });
  },

  uncacheComment: function(comment) {
    if (!comment.media_id) return;
    Media.findOne({ id: comment.media_id }).exec(function (err, result) {
      if (err || !result) return;
      var list = _.get(result, 'comments.list', []);
      list = _.remove(list, function(n) { return comment.id == n });
      Media.update({id: comment.media_id}, { comments: { list: list } }, function(){});
    });
  },

  createMedia: function(user_id, params, callback) {
    var self = this;
    params.user_id = user_id;
    async.auto({
      create: function(next) {
        Media.create(params, next);
      },
      location: function(next) {
        LocationService.findOrCreate({place_id: params.place_id}, next);
      },
      attachTags: ['create', function(ret, next) {
        TagService.updateTags(ret.create, [], next);
      }],
      reload: ['attachTags', function(ret, next) {
        self.getOneMedia(ret.create.id, {}, next);
      }],
    }, function(err, ret) {
      if (err) {
        return callback(err);
      }
      if (!('location' in ret.reload)) {
        ret.reload.location = ret.location;
      }
      callback(null, ret.reload);
    });
  },

  deleteMedia: function (params, callback) {
    async.auto({
      media: function (next) {
        Media.findOne({id: params.id}, next);
      },
      deleteMedia: ['media', function (ret, next) {
        if (!ret.media) {
            return next(ErrorFactory.notFound('Cannot find media id=' + params.id));
        }
        if (ret.media.user_id != params.my_id) {
          return next(ErrorFactory.badRequest('Not yours!!'));
        }
        Media.destroy({id: ret.media.id, user_id: params.my_id}, next);
      }],
      deleteComment: ['deleteMedia', function (ret, next) {
        Comment.destroy({media_id: ret.media.id}, next);
      }],
      deleteLike: ['deleteMedia', function (ret, next) {
        Like.destroy({media_id: ret.media.id}, next);
      }],
    }, function(err, ret) {
      if (err) {
        return callback(err);
      }
      callback(null, ret);
    });
  },

  getMedias: function(query, options, callback) {
    async.auto({
      base: function(next) {
        PaginationService.exec(Media.find(query), options.pagination, next);
      },
    }, function(err, ret) {
      if (err) {
        return callback(err);
      }
      var medias = ret.base;
      if (!medias || !medias.length) {
        return callback(null, []);
      }
      MediaService.appendDetails(medias, options, callback);
    });
  },

  appendDetails: function(medias, options, callback) {
    var mediaIds = _.map(medias, 'id');
    async.auto({
      user: function(next) {
        var user_ids = _.map(medias, 'user_id');
        _.each(medias, function(media) {
          user_ids = user_ids.concat(media.tag_users);
        });
        user_ids = _.uniq(user_ids);
        UserService.getShortedDetails(user_ids, next);
      },
      filters: function(next) {
        // TODO
        next(null, []);
      },
      tags: function(next) {
        Tag.find({ media_id: mediaIds }, next);
      },
      commentCounts: function(next) {
        Comment.native(function(err, collection) {
          if (err) return next(err, null);
          collection.aggregate([
            {"$match" : {media_id:{$in: mediaIds}}},
            {"$group" : {_id:"$media_id", count:{$sum:1}}}])
          .toArray(next);
        });
      },
      comments: function(next) {
        var commentIds = _.flatten(_.map(medias, function(media) {
          return _.get(media, 'comments.list', []);
        }));
        CommentService.getComments({id : commentIds}, {}, next);
      },
      likeCounts: function(next) {
        Like.native(function(err, collection) {
          if (err) return next(err, null);
          collection.aggregate([
            {"$match" : {media_id:{$in: mediaIds}}},
            {"$group" : {_id:"$media_id", count:{$sum:1}}}])
          .toArray(next);
        });
      },
      locations: function(next) {
        LocationService.findByPlaceIds(_.map(medias, 'place_id'), next);
      },
      likedMedias: function(next) {
        Like.find({ media_id: mediaIds, user_id: options.check_liked_uid }, next);
      },
    }, function(err, ret) {
      if (err) {
        return callback(err);
      }

      var keyedFilters       = _.keyBy(ret.filters, 'media_id'),
          keyedTags          = _.groupBy(ret.tags, 'media_id'),
          keyedCommentCounts = _.keyBy(ret.commentCounts, '_id'),
          keyedLikeCounts    = _.keyBy(ret.likeCounts, '_id'),
          keyedLocations     = _.keyBy(ret.locations, 'id'),
          keyedLiked         = _.keyBy(ret.likedMedias, 'media_id'),
          keyedComments      = _.groupBy(ret.comments, 'media_id'),
          keyedUser          = _.keyBy(ret.user, 'id');

      _.forEach(medias, function(media) {
        media.filter = keyedFilters[media.id] || null;
        media.tags   = _.map(keyedTags[media.id], 'name') || [];
        media.images = {
          low_resolution: media.file_url,
          thumbnail: media.file_url,
          standard_resolution: media.file_url,
        };

        media.comments = {
          count: keyedCommentCounts[media.id] ? keyedCommentCounts[media.id].count : 0,
          list: keyedComments[media.id] || [],
        };
        media.likes    = {
          count: keyedLikeCounts[media.id] ? keyedLikeCounts[media.id].count : 0
        };
        media.liked    = media.id in keyedLiked;
        media.location = keyedLocations[media.place_id];
        media.user     = keyedUser[media.user_id];
        media.images   = {
          low_resolution:      media.file_url,
          thumbnail:           media.file_url,
          standard_resolution: media.file_url,
        }
        media.tag_users = _.map(media.tag_users, function(tag_user_id) {
          return keyedUser[tag_user_id];
        });
      });

      callback(null, medias);
    });
  },
  getMediaTaggedIn:function  (query, pagination, callback) {
    async.auto({
      user: function (next) {
        User.findOne({id: query.tag_users}, next);
      },
      medias:['user', function (ret, next) {
        if (!ret.user) {
          return next(ErrorFactory.notFound('Cannot find user id=' + query.tag_users));
        }
        PaginationService.exec(Media.find(query), pagination, next);
      }],
      details:['medias', function (ret, next) {
        if (!ret.medias || !ret.medias.length) {
          return callback(null, []);
        }
        MediaService.appendDetails(ret.medias, {}, callback);
      }],
    },function(err, ret) {
      if (err) {
        return callback(err);
      }
      callback(null,ret.details);
    });
  },
}
