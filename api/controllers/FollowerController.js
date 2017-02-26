
/**
 * FollowerController
 *
 * @description :: Server-side logic for managing controllers
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var passport          = require('passport');
var checkit           = require('checkit');

module.exports = {

  // TODO: Get list with pagination
  getMyFollowers: function (req,res) {
    var user_id = req.user.id,
        options = {
          pagination: PaginationService.parse(_.assign(req.query, {id_field: 'follower_id'}))
        };

    async.auto({
      data: function (next) {
        FollowerService.getFollowers(req.user, {user_id: user_id}, options, next);
      },
      pagination: ['data', function (ret, next) {
        PaginationService.genMetaData(ret.data, next);
      }],
    }, function(err, ret) {
      if (err) {
        res.serverError(err);
        return;
      }
      res.ok(ret);
    });
  },

  // TODO: Get list with pagination
  getFollowers: function (req,res) {
    var [err, params] = new checkit({
      user_id: ['required', 'string'],
    }).validateSync(req.allParams());

    if (err) {
      res.badRequest(err.toString());
      return;
    }

    var user_id = params.user_id,
        options = {
          pagination: PaginationService.parse(_.assign(req.query, {id_field: 'follower_id'}))
        };

    async.auto({
      data: function (next) {
        FollowerService.getFollowers(req.user, {user_id: user_id}, options, next);
      },
      pagination: ['data', function (ret, next) {
        PaginationService.genMetaData(ret.data, next);
      }],
    }, function(err, ret) {
      if (err) {
        res.serverError(err);
        return;
      }

      res.ok(ret);
    });
  },

  // TODO: Get list with pagination
  getMyIdols: function (req, res) {
    var user_id = req.user.id,
        options = {
          pagination: PaginationService.parse(_.assign(req.query, {id_field: 'user_id'}))
        };

    async.auto({
      data: function (next) {
        FollowerService.getIdols(req.user, {follower_id: user_id}, options, next);
      },
      pagination: ['data', function (ret, next) {
        PaginationService.genMetaData(ret.data, next);
      }],
    }, function (err, ret) {
      if (err) {
        res.serverError(err);
        return;
      }

      res.ok(ret);
    });
  },

  // TODO: Get list with pagination
  getIdols: function (req, res) {
    var [err, params] = new checkit({
      user_id: ['required', 'string'],
    }).validateSync(req.allParams());

    if (err) {
      res.badRequest(err.toString());
      return;
    }

    var user_id = params.user_id,
        options = {
          pagination: PaginationService.parse(_.assign(req.query, {id_field: 'user_id'}))
        };

    async.auto({
      data: function (next) {
        FollowerService.getIdols(req.user, {follower_id: user_id}, options, next);
      },
      pagination: ['data', function (ret, next) {
        PaginationService.genMetaData(ret.data, next);
      }],
    }, function (err, ret) {
      if (err) {
        res.serverError(err);
        return;
      }

      res.ok(ret);
    });
  },

  // TODO: TBD
  getRequestedBy: function (req, res) {
    res.badRequest('Not available due to requirements.');
  },

  getRelationship: function (req, res) {
    var [err, params] = new checkit({
      user_id: ['required', 'string'],
    }).validateSync(req.allParams());

    if (err) {
      res.badRequest(err.toString());
      return;
    }

    var my_id = req.user.id,
        target_id = params.user_id;

    if (my_id == target_id) {
      res.badRequest('Cannot get relationship with yourself');
      return;
    }

    async.waterfall([
      function getRelationship(next) {
        FollowerService.getRelationship(my_id, target_id, next);
      }
    ], function(err, ret) {
      if (err) {
        res.serverError(err);
        return;
      }

      res.ok(ret);
    });
  },

  updateRelationship : function (req, res) {
    var [err, params] = new checkit({
      user_id: ['required', 'string'],
      action: ['required', 'string'],
    }).validateSync(req.allParams());

    if (err) {
      res.badRequest(err.toString());
      return;
    }

    async.waterfall([
      function exec(next) {
        FollowerService.updateRelationship(params.action, {
          user_id: params.user_id,
          follower_id: req.user.id
        }, next);
      }
    ], function(err, ret) {
      if (err) {
        res.serverError(err);
        return;
      }

      res.ok(ret);
    });
  },
};
