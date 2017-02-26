/**
 * UserController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
 var passport = require('passport');
 var checkit = require('checkit');
 var path = require('path');

module.exports = {
  getById: function (req, res) {
    var [err, params] = new checkit({
      user_id: ['required', 'string'],
    }).validateSync(req.allParams());

    if (err) {
      return res.badRequest(err.toString());
    }

    UserService.getOneById(params.user_id, function(err, user) {
      if (err) {
        return res.serverError(err.toString());
      }
      if (!user) {
        return res.notFound('Cannot find user id=' + params.user_id);
      }
      res.ok({data: user});
    });
  },

  self: function (req,res) {
    var user_id = req.user.id,
        options = {};

    async.auto({
      profile: function (next) {
        UserService.getSelf(user_id, options, next);
      },
    }, function(err, ret) {
      if (err) {
        return res.serverError(err.toString());
      }
      res.ok(ret.profile);
    });
  },

  updateAvatar: function(req, res) {
    // TODO: refactor and make FileUploadService
    var uploadDir = '/uploads/images/avatar';
    async.auto({
      uploadFiles: function(next) {
        req.file('image').upload({
          maxBytes: 250000, // Just for test env. TODO: move to config
          dirname: require('path').resolve(sails.config.appPath, 'assets' + uploadDir),
        }, function(_err, uploadedFiles) {
          uploadFiles = uploadedFiles;
          next(_err, uploadedFiles);
        });
      },
      updateAvatar: ['uploadFiles', function(ret, next) {
        var uploadFiles = ret.uploadFiles;
        if (!uploadFiles || !uploadFiles.length) {
          return res.badRequest('Cannot find uploaded files.');
        }

        // Only process 1 image per upload
        var uploadedFile = uploadFiles[0];
        var file_url = process.env.APP_ENDPOINT + uploadDir + '/' + path.basename(uploadedFile.fd);
        User.update({
          id: req.user.id
        }, {
          profile_picture: file_url,
        }, next);
      }],
    }, function(err, ret) {
      if (err) {
        return res.serverError(err.toString());
      }

      var user = null;
      if (ret.updateAvatar.length > 0) {
        user = ret.updateAvatar[0];
      }

      res.ok(user);
    });
  },

  updateProfile: function(req, res) {
    var [err, params] = new checkit({
      email: ['email'],
      full_name: ['string'],
      bio: ['string'],
      website: ['string'],
      phone: ['string'],
      gender: ['string'],
    }).validateSync(req.allParams());

    if (err) {
      return res.badRequest(err.toString());
    }

    async.auto({
      update: function(next) {
        User.update({
          id: req.user.id,
        }, params, next);
      },
    }, function(err, ret) {
      if (err) {
        return res.serverError(err);
      }

      var user = null;
      if (ret.update.length > 0 ) {
        user = ret.update[0];
      }

      res.ok(user);
    });
  },

  addDeviceId: function(req, res) {
    var [err, params] = new checkit({
      os: ['required', 'string'],
      device_id: ['required', 'string'],
      device_token: ['required', 'string'],
    }).validateSync(req.allParams());

    if (err) {
      return res.badRequest(err.toString());
    }

    UserService.addDeviceId(req.user.id, params.os, params.device_id, params.device_token, function(err, ret) {
      if (err) {
        return res.serverError(err);
      }

      res.ok(null);
    });

  },

  search: function (req, res) {
    var rule = _.assign({q: ['required', 'string']}, PaginationService.getRule());
    var [err, params] = new checkit(rule).validateSync(req.query);
    var me = req.user;
    if (err) {
      return res.badRequest(err.toString());
    }

    async.auto({
      data: function (next) {
        UserService.searchUsers(params.q, {pagination: PaginationService.parse(params)}, next);
      },
      pagination: ['data', function (ret, next) {
        PaginationService.genMetaData(ret.data, next);
      }],
      myIdols: ['data', function(ret, next) {
        if (!me || !ret.data || !ret.data.length) {
          return next (null, []);
        }

        var idol_ids = _.map(ret.data, 'id');
        Follower.find({
          user_id: idol_ids,
          follower_id: me.id,
        }, next);
      }],
      mix: ['myIdols', function(ret, next) {
        var keyedIdols = _.keyBy(ret.myIdols, 'user_id');
        var listWithoutMe = _.filter(ret.data, function(user) {
          return !me || user.id != me.id;
        });
        var result = _.map(listWithoutMe, function(user) {
          user.is_my_idol = !!keyedIdols[user.id];
          return user;
        });
        next(null, result);
      }],
    }, function(err, ret) {
      if (err) {
        return res.serverError(err.toString());
      }
      res.ok({data: ret.mix, pagination: ret.pagination});
    });
  },

  getRecentMedias: function(req, res) {
    var rule = _.assign({user_id: 'string'}, PaginationService.getRule());
    var [err, params] = new checkit(rule).validateSync(req.allParams());
    if (err) {
      return res.badRequest(err.toString());
    }

    var user_id = params.user_id || req.user.id;
    var options = {
      pagination: PaginationService.parse(params),
      check_liked_uid: req.user.id,
    }
    async.auto({
      data: function (next) {
        MediaService.getMediasByUser(user_id, options, next);
      },
      pagination: ['data', function (ret, next) {
        PaginationService.genMetaData(ret.data, next);
      }],
    }, function(err, ret) {
      if (err) {
        return res.serverError(err.toString());
      }
      res.ok(ret);
    });
  },

  getLikedMedias: function (req, res) {
    var user_id = req.user.id,
        options = {};

    req.query.before_id = req.query.before_like_id;
    req.query.after_id  = req.query.after_like_id;
    var [err, params] = new checkit(PaginationService.getRule()).validateSync(req.query);
    if (err) {
      return res.badRequest(err.toString());
    }

    async.auto({
      data: function(next) {
        LikeService.getLikedMediaByUser(user_id, PaginationService.parse(params), next)
      },
      pagination: ['data', function (ret, next) {
        PaginationService.genMetaData(ret.data.liked, next);
      }],
    }, function(err, ret) {
      if (err) {
        return res.serverError(err.toString());
      }
      res.ok({ data: ret.data.medias, pagination: ret.pagination });
    });
  },

  getRandomUsers: function(req, res) {
    async.waterfall([
      function(next) {
        User.find({}, next);
      }
    ], function(err, ret) {
      if (err) {
        return res.serverError(err);
      }
      res.ok(ret);
    });
  },
  getMediaTaggedIn: function (req, res) {
    var [err, params] = new checkit({
      user_id: ['required', 'string'],
    }).validateSync(req.allParams());

    if (err) {
      return res.badRequest(err.toString());
    }
    var user_id = params.user_id,
      pagination = PaginationService.parse(req.query);
    async.auto({
      data: function (next) {
        MediaService.getMediaTaggedIn({tag_users: user_id}, pagination, next);
      },
      pagination: ['data', function (ret, next) {
        PaginationService.genMetaData(ret.data, next);
      }],
    }, function (err, ret) {
      if (err) {
        res.serverError(err);
        return;
      }
      if (!ret.data) {
        return  res.ok({data : []});
      }
      res.ok(ret);
    });
  },
};
