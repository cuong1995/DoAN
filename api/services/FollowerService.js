module.exports = {

  updateRelationship: function(action, def, callback) {
    if (action === 'follow') {
      return this._createFollower(def, callback);
    }

    if (action === 'unfollow') {
      return this._removeFollower(def, callback);
    }

    callback(ErrorFactory.badRequest('Unsupported action: ' + action));
  },

  _createFollower: function(def, callback) {
    async.auto({
      existed: function(next) {
        Follower.findOne({
          user_id: def.user_id,
          follower_id: def.follower_id,
        }, next);
      },
      create: ['existed', function(ret, next) {
        if (ret.existed) {
          return next(ErrorFactory.badRequest('Relationship is already existed.'));
        }

        Follower.create({
          user_id: def.user_id,
          follower_id: def.follower_id,
          status: true,
        }, next);
      }],
    }, function(err, ret) {
      if (err) {
        return callback(err);
      }

      callback(null, {
        outgoing_status: 'follows'
      });
    });
  },

  _removeFollower: function(def, callback) {
    async.auto({
      existed: function(next) {
        Follower.findOne({
          user_id: def.user_id,
          follower_id: def.follower_id,
        }, next);
      },
      remove: ['existed', function(ret, next) {
        if (!ret.existed) {
          return next(ErrorFactory.notFound('Relationship does not exist.'));
        }

        Follower.destroy({
          user_id: def.user_id,
          follower_id: def.follower_id,
        }, next);
      }],
    }, function(err, ret) {
      if (err) {
        return callback(err);
      }

      callback(null, {
        outgoing_status: 'none'
      });
    });
  },

  // TODO: get list with pagination
  getFollowers: function(me, query, options, callback) {
    async.auto({
      user: function(next) {
        User.findOne({
          id: query.user_id,
        }, next);
      },
      followers: ['user', function (ret, next) {
        if (!ret.user) {
          return next(ErrorFactory.notFound('Cannot find user id=' + query.user_id));
        }

      PaginationService.exec(Follower.find(query), options.pagination, next);
      }],
      users: ['followers', function (ret, next) {
        if (!ret.followers || !ret.followers.length) {
          return next(null, []);
        }

        var follower_ids = _.map(ret.followers, 'follower_id');
        UserService.getShortedDetails(follower_ids, next);
      }],
      idols: ['users', function(ret, next) {
        if (!me || !ret.followers || !ret.followers.length) {
          return next (null, []);
        }

        var follower_ids = _.map(ret.followers, 'follower_id');
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

  // TODO: get list with pagination
  getIdols: function(me, query, options, callback){
    async.auto({
      user: function(next) {
        User.findOne({
          id: query.follower_id,
        }, next);
      },
      idols: ['user', function (ret, next) {
        if (!ret.user) {
          return next(ErrorFactory.notFound('Cannot find user id=' + query.follower_id));
        }
        PaginationService.exec(Follower.find(query), options.pagination, next);
      }],
      users: ['idols', function (ret, next) {
        if (!ret.idols || !ret.idols.length) {
          return next(null, []);
        }

        var user_ids = _.map(ret.idols, 'user_id');
        UserService.getShortedDetails(user_ids, next);
      }],
      myIdols: ['users', function(ret, next) {
        if (!me || !ret.idols || !ret.idols.length) {
          return next (null, []);
        }

        var idol_ids = _.map(ret.idols, 'user_id');
        Follower.find({
          user_id: idol_ids,
          follower_id: me.id,
        }, next);
      }],
      mix: ['myIdols', function(ret, next) {
        var keyedIdols = _.keyBy(ret.myIdols, 'user_id');
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

  getFollowerIds: function(user_id, options, callback){
    async.auto({
      followers: function (next) {
        Follower.find({user_id: user_id},next);
      },
      followerIds:['followers', function (ret, next) {
        next(null, _.map(ret.followers, 'follower_id'));
      }],
    }, function (err, ret) {
      if (err) {
        callback(err);
        return;
      }
      callback(null, ret.followerIds);
    });
  },

  getIdolIds: function(user_id, options, callback) {
    async.auto({
      idols: function (next) {
        Follower.find({
          follower_id: user_id,
        }, next);
      },
      idolIds:['idols', function (ret, next) {
        next(null, _.map(ret.idols, 'user_id'));
      }],
    }, function (err, ret) {
      if (err) {
        callback(err);
        return;
      }
      callback(null, ret.idolIds);
    });
  },

  // get relationship
  getRelationship: function (my_id, target_id, callback) {
    async.auto({
      target: function(next) {
        User.findOne({
          id: target_id
        }, next);
      },
      in: ['target', function (ret, next) {
        if (!ret.target) {
          next(ErrorFactory.notFound('Cannot find user id=' + target_id));
          return;
        }

        Follower.findOne({
          user_id: my_id,
          follower_id: target_id,
        }, next);
      }],
      incoming_status :['in',function (ret, next) {
        if (!ret.in) {
          return next(null, "none");
        }

        if (ret.in.status == true) {
          return next(null,"followed_by");
        } else {
          return next(null, "requested_by");
        }
      }],
      out: ['target', function (ret, next) {
        if (!ret.target) {
          next(ErrorFactory.notFound('Cannot find user id=' + target_id));
          return;
        }

        Follower.findOne({
          user_id: target_id,
          follower_id: my_id,
        }, next);
      }],
      outgoing_status :['out', function (ret, next) {
        if (!ret.out) {
          return next(null, "none");
        }

        if (ret.out.status == true) {
          return next(null,"follows");
        } else {
          return next(null, "requested");
        }
      }],
    }, function(err, ret) {
      if (err) {
        callback(err);
        return;
      }

      callback(null, {
        outgoing_status: ret.outgoing_status,
        incoming_status: ret.incoming_status,
      });
    });
  },
}
