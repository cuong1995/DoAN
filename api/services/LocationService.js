module.exports = {
  getByPlaceId: function (place_id, callback) {
    async.auto({
      base: function (next) {
        ExternalPlaceService.detailsById(place_id, next);
      },
    }, function (err, ret) {
      if (err) {
        return callback(err);
      }
      if(!ret.base){
        return callback(null, null);
      }
      callback(null, ExternalPlaceService.locationFormater(ret.base));
    });
  },

  findOrCreate: function(params, callback) {
    async.auto({
      location: function(next) {
        Location.findOne({place_id: params.place_id}, next);
      },
      needCreate: ['location', function(ret, next) {
        if (ret.location) return next();
        if ('name' in params && 'lng' in params && 'lat' in params ) return next(null, {
          id: params.place_id,
          name: params.name,
          latitude: params.lat,
          longitude: params.lng
        });
        LocationService.getByPlaceId(params.place_id, next);
      }],
    }, function(err, ret) {
      if (err) {
        return callback(err);
      }
      var location = ret.needCreate || ret.location;
      if (ret.needCreate) {
        var coordinates = [parseFloat(location.longitude), parseFloat(location.latitude)];
        Location.create({place_id: location.id, name : location.name, coordinates : coordinates}, callback);
      } else {
        callback(null, location);
      }
    });
  },

  updateByPlaceId: function(params, callback) {
    var coordinates = [parseFloat(params.lng), parseFloat(params.lat)];
    Location.update({place_id: params.place_id}, {name: params.name, coordinates: coordinates}, callback);
  },

  findByPlaceIds: function(place_ids, callback) {
    Location.find({place_id: place_ids}).exec(function (err, result) {
      if (err) return callback(err);
      return callback(null, LocationService.formatLocations(result));
    });
  },

  formatLocations: function(locations) {
    return _.map(locations, function(location) {
      return {
        id: location.place_id,
        name: location.name,
        latitude: location.coordinates[1],
        longitude: location.coordinates[0]
      }
    })
  },

  findNear: function(conditions, callback) {
    var params = {
      'location' : [conditions.lat, conditions.lng],
      'radius' : conditions.distance
    }
    ExternalPlaceService.nearbySearch(params, function(err, res) {
      if (!_.isEmpty(res)) {
        res = _.map(res, ExternalPlaceService.locationFormater);
      }
      return callback(err, res);
    });
  },

  findCachedNear: function (conditions, callback) {
    Location.native(function (err, collection) {
      if (err) return callback(err);
      collection.geoNear({
          type: "Point" ,
          coordinates: [ conditions.lng, conditions.lat ]
      }, {
        limit: conditions.limit || 30,
        maxDistance: conditions.maxDistance,
        distanceMultiplier: 1,
        spherical : true
      }, function (err, places) {
        if (err) return callback(err);

        return callback(null, places.results);
      });
    });
  },
}
