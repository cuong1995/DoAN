var request = require('superagent');

const OUTPUT = 'json'; 

const NEARBY_SEARCH = 'nearbysearch';
const TEXT_SEARCH = 'textsearch';
const RADAR_SEARCH = 'radarsearch';
const DETAILS = 'details';
const ADD = 'add';
const DELETE = 'delete';
const BASE_URL = 'https://maps.googleapis.com/maps/api/place';

function getOriginalURL(api, query) {
	return  _.join([BASE_URL, api, OUTPUT], '/');
}

function sendGet(api, params, cb) {
  request.get(getOriginalURL(api, params))
  .query({key: process.env.GOOGLE_PLACE_API})
  .query(params)
  .end(function(err, res) {
  	formatResponse(err, res, cb);
  });
}

function sendPost(api, params, cb) {
  request.post(getOriginalURL(api))
  .query({key: process.env.GOOGLE_PLACE_API})
  .send(params)
  .end(function(err, res) {
  	formatResponse(err, res, cb);
  });
}

function formatResponse(err, res, cb) {
	if (err || !res.ok) {
		cb(err, null);
	} else {
		cb(null, res.body.results || res.body.result);
	}
}

module.exports = {
  nearbySearch: function(params, cb) {
  	params.location = _.join(params.location, ',');
    sendGet(NEARBY_SEARCH, params, cb);
  },

  textSearch: function(params, cb) {
    sendGet(TEXT_SEARCH, params, cb);
  },

  radarSearch: function(params, cb) {
    sendGet(RADAR_SEARCH, params, cb);
  },

  details: function(params, cb) {
    sendGet(DETAILS, params, cb);
  },

  detailsById: function(place_id, cb) {
    sendGet(DETAILS, {placeid: place_id}, cb);
  },

  add: function(params, cb) {
    sendGet(ADD, params, cb);
  },

  delete: function(params, cb) {
    sendGet(DELETE, params, cb);
  },

  locationFormater: function(place) {
  	return {
      id: place.place_id,
      name: place.name,
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng
    }
  },

}