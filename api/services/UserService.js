module.exports = {
  getSelf: function(user_id, options, callback){
    UserService.getOneById(user_id, callback);
  },

  getOneById: function(user_id, callback){
    async.auto({
      base: function (next) {
        UserService.getPublicDetails(user_id, next);
      },
      mediaCount: ['base', function (ret, next) {
        Media.count({user_id: user_id}, next);
      }],
      followsCount: ['base', function (ret, next) {
        Follower.count({follower_id: user_id}, next);
      }],
      followed_byCount: ['base', function (ret, next) {
        Follower.count({user_id: user_id}, next);
      }],
    }, function (err, ret) {
      if (err) {
        callback(err);
        return;
      }
      if (!ret.base || ret.base.length != 1) {
        callback(null, null);
        return;
      }

      var m = ret.base[0];

      m.counts = {
        media: ret.mediaCount,
        follows: ret.followsCount,
        followed_by: ret.followed_byCount
      };

      callback(null, m);
    });
  },

  getFormatedDetails: function(query, callback) {
    async.auto({
      users: function (next) {
        User.find(query, next);
      },
    }, function (err, ret) {
      if (err) {
        callback(err);
        return;
      }
      if (!ret.users || !ret.users.length) {
        callback(null, null);
        return;
      }
      callback(null, _.forEach(ret.users, function(user) {
        user.username = user.full_name;
      }));
    });
  },

  searchUsers: function(query, options, callback) {
    var query = {
      where: {
        or: [
          { full_name: { 'contains': query } },
        ],
      },
      select: ['full_name', 'profile_picture']
    };
    PaginationService.exec(User.find(query), options.pagination, function(err, ret) {
      if (err) return callback(err);
      callback(null, _.map(ret, function(user) {
        user.username = user.full_name;
        return _.omit(user, 'full_name');
      }));
    });
  },

  getShortedDetails: function(user_ids, callback) {
    UserService.getFormatedDetails({ where: { id: user_ids }, select: ['full_name', 'profile_picture'] }, callback);
  },

  getPublicDetails: function(user_ids, callback) {
    UserService.getFormatedDetails({ where: { id: user_ids }, select: ['full_name', 'profile_picture', 'bio', 'website'] }, callback);
  },

  addDeviceId: function(user_id, os, device_id, device_token, callback) {
    var query = {
      user_id: user_id,
      os: os,
      device_id: device_id,
    };

    var def = {
      user_id: user_id,
      os: os,
      device_id: device_id,
      device_token: device_token,
    };

    async.auto({
      existed: function(next) {
        Device.findOne(query, next);
      },
      add: ['existed', function(ret, next) {
        if (!ret.existed) {
          return Device.create(def, next);
        }

        Device.update(query, { device_token: device_token }, next);
      }],
    }, callback);
  },

}
