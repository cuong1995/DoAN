module.exports = {

  createComment: function(def, callback) {
    async.auto({
      media: function(next) {
        Media.findOne({
          id: def.media_id
        }, next);
      },
      comment: ['media', function(ret, next) {
        if (!ret.media) {
          return next(ErrorFactory.notFound('Cannot find media id=' + def.media_id));
        }
        if (ret.media.is_comment_off == true) {
          return next(ErrorFactory.badRequest('Comment is turn off'));
        }
        Comment.create(def, next);
      }],
      count: ['comment', function(ret, next) {
        Comment.count({
          media_id: def.media_id
        }, next);
      }],
    }, function(err, ret) {
      if (err) {
        return callback(err);
      }
      var comment = ret.comment;
      comment.count = ret.count;
      MediaService.cacheComment(comment);
      return callback(null, comment);
    });
  },

  deleteComment: function (params, callback) {
    async.auto({
      media: function (next) {
        Media.findOne({
          id : params.media_id
        }, next);
      },
      comment: ['media', function (ret, next) {
        if (!ret.media) {
          return next(ErrorFactory.notFound('Cannot find media id=' + params.media_id));
        }
        Comment.findOne({id: params.comment_id, media_id:ret.media.id}, next);
      }],
      deleteComment: ['comment', function (ret, next) {
        if (!ret.comment) {
          return next(ErrorFactory.notFound('Cannot find comment id=' + params.comment_id + ' of media id=' + params.media_id));
        }

        if (ret.comment.user_id != params.my_id) {
          if (ret.media.user_id == params.my_id) {
            Comment.destroy({media_id:ret.comment.media_id, id: ret.comment.id});
          } else {
            return next(ErrorFactory.badRequest('Not yours comment !!'));
          }
        }
        Comment.destroy({media_id:ret.comment.media_id, id: ret.comment.id},next);
      }],
    }, function(err, ret) {
      if (err) {
        return callback(err);
      }
      callback(null, ret);
    });
  },

  getComments : function (query, pagination, callback) {
    async.auto({
      media: function (next) {
        if (!query.media_id) {
          return next(null, null);
        }
        Media.findOne({
          id: query.media_id,
        }, next);
      },
      comments :['media', function (ret, next) {
        if (query.media_id && !ret.media) {
          return next(ErrorFactory.notFound('Cannot find media id=' + query.media_id));
        }
        if (query.media_id && ret.media.is_comment_off == true) {
          return next(null, []);
        }
        PaginationService.exec(Comment.find(query), pagination, next);
      }],
    }, function (err, ret) {
      if (err) {
        return callback(err);
      }
      var comments = ret.comments;
      if (!comments || !comments.length) {
        return callback(null, []);
      }
      CommentService.appendDetails(comments, callback);
    });
  },

  appendDetails: function (comments, callback) {
    var commentIds = _.map(comments, 'id');
    async.auto({
      user : function (next) {
        UserService.getShortedDetails(_.map(comments,'user_id'),next);
      },
    }, function (err, ret) {
      if (err) {
        return callback(err);
      }
      var keyedUser = _.keyBy(ret.user,'id');

      _.forEach(comments, function (comment) {
        comment.from = keyedUser[comment.user_id];
      });
      callback(null, comments);
    });
  },

};
