/**
 * LocationController
 *
 * @description :: Server-side logic for managing media
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
 var passport = require('passport');
 var checkit = require('checkit');

const DEFAULT_DISTANCE = 500;

module.exports = {
  createLocation : function (req, res) {
    var [err, params] = new checkit({
      place_id: ['required', 'string'],
      lat: ['required', 'numeric'],
      lng: ['required','numeric'],
      name: ['required', 'string']
    }).validateSync(req.allParams());

    if (err) {
      return res.badRequest(err.toString());
    }

    LocationService.findOrCreate(params, function (err, location) {
      if (err) {
        console.log(err);
      }
      res.ok({data: location});
    });
  },

  updateLocation : function (req, res) {
    var [err, params] = new checkit({
      place_id:['required', 'string'],
      name: ['required', 'string'],
      lat: ['required', 'numeric'],
      lng: ['required','numeric'],
    }).validateSync(req.allParams());

    if (err) {
      return res.badRequest(err.toString());
    }

    LocationService.updateByPlaceId(params, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        return res.ok({data: result});
      }
    });
  },

  getLocationById : function (req, res) {
    var [err, params] = new checkit({
      place_id: ['required', 'string'],
    }).validateSync(req.allParams());

    if (err) {
      return res.badRequest(err.toString());
    }
    LocationService.getByPlaceId(params.place_id, function (err, location) {
      if (err) {
        return res.serverError(err.toString());
      }
      if (!location) {
        return res.ok({data : []});
      }
      res.ok({data: location});
    });
  },

  getMediaOfLocation: function (req,res){
    var [err, params] = new checkit({
      place_id: ['required', 'string'],
    }).validateSync(req.allParams());
    var options = {}

    if (err) {
      return res.badRequest(err.toString());
    }
    var place_id = params.place_id;
    options.pagination = PaginationService.parse(req.query);
    async.auto({
      data: function (next) {
        MediaService.getMedias({place_id : place_id}, options, next);
      },
    }, function (err, ret) {
      if (err) {
        return res.serverError(err.toString());
      }
      return res.ok(ret.data);
    });
  },

  search: function (req, res) {
    var [err, params] = new checkit({
      lat: ['required', 'numeric'],
      lng: ['required', 'numeric'],
      distance: ['lessThanEqualTo:750', 'naturalNonZero'],
    }).validateSync(req.allParams());
    if (err) {
      return res.badRequest(err.toString());
    }
    params.distance = params.distance || DEFAULT_DISTANCE;
    LocationService.findNear(params, function (err, results) {
      if (err) return res.serverError(err)
      return res.ok(results);
    });

  },
	getLocationOfUser: function (req,res){
    var [err, params] = new checkit({
      user_id: ['required', 'string'],
    }).validateSync(req.allParams());
    var options = {}

    if (err) {
      return res.badRequest(err.toString());
    }
    var user_id = params.user_id;
    async.auto({
      data: function (next) {
        LocationService.getLocationOfUser(user_id , next);
      },
    }, function (err, ret) {
      if (err) {
        return res.serverError(err.toString());
      }
      return res.ok(ret.data);
    });
  },
}
