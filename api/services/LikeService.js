module.exports = {

  createLike: function(def, callback) {
    async.auto({
      media: function(next) {
        Media.findOne({
          id: def.media_id
        }, next);
      },
      existed: ['media', function(ret, next) {
        if (!ret.media) {
          return next(ErrorFactory.notFound('Cannot find media id=' + def.media_id));
        }
        Like.findOne(def, next);
      }],
      createNew: ['existed', function(ret, next) {
        if (ret.existed) {
          return next(ErrorFactory.badRequest('Liked already.'));
        }
        Like.create(def, next);
      }],
      count: ['createNew', function(ret, next) {
        Like.count({
          media_id: def.media_id
        }, next);
      }],
    }, function(err, ret) {
      if (err) {
        return callback(err);
      }

      var like = ret.createNew;
      like.count = ret.count;

      return callback(null, ret.createNew);
    });
  },

  deleteLike: function (params, callback) {
    async.auto({
      media: function (next) {
        Media.findOne({
          id: params.media_id
        }, next);
      },
      like: ['media', function (ret, next) {
        if (!ret.media) {
          return next(ErrorFactory.notFound('Cannot find media id=' + params.media_id));
        }
        Like.findOne({media_id: ret.media.id, user_id: params.my_id},next);
      }],
      deleteLike: ['like', function (ret, next) {
        if (!ret.like) {
          return next(ErrorFactory.badRequest('You do not like this media id=' + params.media_id));
        }
        Like.destroy({media_id: ret.media.id, user_id: params.my_id},next);
      }],
    }, function(err, ret) {
      if (err) {
        return callback(err);
      }
      callback(null, ret);
    });
  },

  getLikeUser: function (me, query, pagination, callback) {
    async.auto({
      media: function (next) {
        Media.findOne({
          id: query.media_id
        },next);
      },
      likeUsers : ['media', function (ret, next) {
        if (!ret.media){
          return next(ErrorFactory.notFound('Cannot find media id=' + query.media_id));
        }
        PaginationService.exec(Like.find(query), pagination, next);
      }],
      users : ['likeUsers', function (ret, next) {
        if (!ret.likeUsers.length) {
          return next(null, []);
        }
        var user_ids = _.map(ret.likeUsers, 'user_id');
        UserService.getShortedDetails(user_ids, next);
      }],
      idols: ['users', function(ret, next) {
        if (!me || !ret.likeUsers || !ret.likeUsers.length) {
          return next (null, []);
        }

        var follower_ids = _.map(ret.likeUsers, 'user_id');
        Follower.find({
          user_id: follower_ids,
          follower_id: me.id,
        }, next);
      }],
      mix: ['idols', function(ret, next) {
        var keyedIdols = _.keyBy(ret.idols, 'user_id');
        var result = _.map(ret.users, function(user) {
          user.is_my_idol = !!keyedIdols[user.id];
          return user;
        });
        next(null, result);
      }],
    }, function (err, ret) {
      if (err) {
        callback(err);
        return;
      }

      callback(null, ret.mix);
    });
  },

  getLikedMediaByUser: function(user_id, pagination, callback) {
    async.auto({
      liked: function (next) {
        PaginationService.exec(Like.find({ user_id: user_id }), pagination, next);
      },
      medias: ['liked', function (ret, next) {
        MediaService.getMedias(_.map(ret.liked, 'media_id'), null, next);
      }],
    }, function(err, ret) {
      if (err) {
        return callback(err);
      }
      callback(null, ret);
    });
  },
}
