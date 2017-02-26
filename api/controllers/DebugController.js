var checkit = require('checkit');

module.exports = {

  socketPage: function(req, res) {
    res.view('debug-socket', {user: req.user});
  },

  sendAPN: function(req, res) {
    var [err, params] = new checkit({
      user_ids: ['required', 'string'],
      badge: ['natural'],
      alert: ['string'],
    }).validateSync(req.allParams());

    if (err) {
      return res.badRequest(err.toString());
    }

    var user_ids = params.user_ids.split(',');

    // Just for testing
    var aps = {
      expiry: Math.floor(Date.now() / 1000) + 3600, // Expires 1 hour from now.
      sound: 'ping.aiff',
      badge: parseInt(params.badge) || 7,
      alert: params.alert || 'You have a new message',
    };

    async.auto({
      devices: function(next) {
        Device.find({
          user_id: {$in: user_ids},
          os: 'ios',
        }, next);
      },
      action: ['devices', function(ret, next) {
        if (!ret.devices || !ret.devices.length) {
          return next(null, null);
        }

        var device_tokens = _.uniq(_.map(ret.devices, 'device_token'));
        PushNotificationService.sendAPN(device_tokens, aps, next);
      }],
    }, function(err, ret) {
      if (err) {
        return res.serverError(err);
      }

      res.ok(ret.action);
    });
  },

  sendGCM: function(req, res) {
    res.badRequest('TODO: implement me.');
  },

};
