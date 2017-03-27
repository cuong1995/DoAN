/**
 * MediaController
 *
 * @description :: Server-side logic for managing media
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var passport = require('passport');
var checkit = require('checkit');
var path = require('path');
var logger = require('log4js').getLogger();
const DEFAULT_DISTANCE = 1000;

module.exports = {

  getOne: function (req,res) {
    var [err, params] = new checkit({
      id: ['required', 'string'],
    }).validateSync(req.allParams());

    var options = {};
    // options.check_liked_uid = req.user.id;

    if (err) {
      return res.badRequest(err.toString());
    }

    MediaService.getOneMedia(params.id, options, function(err, media) {
      if (err) {
        return res.serverError(err.toString());
      }

      if (!media) {
        return res.notFound('Cannot find media id=' + params.id);
      }

      res.ok({
        data: media
      });
    });
  },

  createOne: function(req, res) {
    var [err, params] = new checkit({
      type: ['required', 'string'],
      caption: ['string'],
      tag_users: ['string'],
      place_id: ['string'],
	  title: ['string']
    }).validateSync(req.allParams());
    var uploadDir = '/uploads/media';

    if (err) {
      return res.badRequest(err.toString());
    }

    params.user_id = req.user.id;
    if (params.tag_users == null|| !params.tag_users) {
      params.tag_users = [];
    } else params.tag_users = _.split(params.tag_users,',');
    async.auto({
      uploadFiles: function(next) {
        req.file('media').upload({
          maxBytes: 10000000, // Just for test env. TODO: move to config
          dirname: require('path').resolve(sails.config.appPath, 'assets' + uploadDir),
        }, function(_err, uploadedFiles) {
          uploadFiles = uploadedFiles;
          next(_err, uploadedFiles);
        });
      },
      createMedia: ['uploadFiles', function(ret, next) {
        var uploadFiles = ret.uploadFiles;
        if (!uploadFiles || !uploadFiles.length) {
          return res.badRequest('Cannot find uploaded files.');
        }

        // Only process 1 image per upload
        
		/*var uploadedFiles = uploadFiles;
        logger.info('MediaController::createOne uploadedFile=' + util.inspect(uploadedFile));
        params.file_url = process.env.APP_ENDPOINT + uploadDir + '/' + path.basename(uploadedFile.fd);
		*/
		var a=[];
		for(var i=0; i< uploadFiles.length; i++){
			var file_url = process.env.APP_ENDPOINT + uploadDir + '/' + path.basename(uploadFiles[i].fd);
			a.push(file_url);
		};
		params.file_url = a;
		
        MediaService.createMedia(req.user.id, params, next);
      }],
    }, function(err, ret) {
      if (err) {
        return res.serverError(err.toString());
      }

      res.ok(ret.createMedia);
    });
  },

  updateOne: function(req, res) {
    var [err, params] = new checkit({
      id: ['required', 'string'],
      caption: ['string'],
      tag_users: ['string'],
      place_id: ['string'],
      is_comment_off: ['string'],
	  title: ['string']
    }).validateSync(req.allParams());

    if (err) {
      return res.badRequest(err.toString());
    }
    if (params.tag_users == null|| !params.tag_users) {
      params.tag_users = [];
    } else params.tag_users = _.split(params.tag_users,',');
    MediaService.updateOne(req.user.id, params, function(err, media) {
      if (err) {
        return res.serverError(err.toString());
      }

      if (!media) {
        return res.notFound('Cannot update media id=' + params.id);
      }

      res.ok(media);
    });
  },

  searchByLocation: function(req, res) {
    var [err, params] = new checkit({
      lat: ['required', 'numeric'],
      lng: ['required', 'numeric'],
      distance: ['lessThanEqualTo:5000', 'naturalNonZero'],
    }).validateSync(req.allParams());
    if (err) {
      return res.badRequest(err.toString());
    }
    var conditions = {
        lng: parseFloat(params.lng),
        lat: parseFloat(params.lat),
        maxDistance: params.distance || DEFAULT_DISTANCE,
        limit: req.param('limit') || 30,
      };
    async.auto({
      locations: function(next) {
        LocationService.findCachedNear(conditions, next);
      },
      medias: ['locations', function(ret, next) {
        MediaService.getMedias({place_id: _.map(ret.locations, 'place_id')}, {}, next);
      }],
    }, function(err, ret) {
      if (err) {
        return res.serverError(err.toString());
      }
      res.ok({ data: ret.medias });
    });
  },

  deleteOne: function (req, res) {
    var [err, params] = new checkit({
      id : ['required', 'string'],
    }).validateSync(req.allParams());

    if (err) {
      res.badRequest(err.toString());
      return;
    }
    params.my_id = req.user.id;
    MediaService.deleteMedia(params, function (err) {
      if (err) {
        return res.serverError(err);
      }
      res.ok('deleted');
    })
  },

};
