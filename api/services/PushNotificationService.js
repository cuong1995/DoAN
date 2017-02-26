var apn = require('apn');
var util = require('util');

module.exports = {

  // Specs of aps object is defined by Apple:
  // https://developer.apple.com/library/content/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/PayloadKeyReference.html
  sendAPN: function(device_token, aps, extra_data, callback) {
    if (typeof extra_data === 'function') {
      callback = extra_data;
    }

    var provider = new apn.Provider({
      token: {
        key: process.env.APP_APN_AUTH_KEY,
        keyId: process.env.APP_APN_AUTH_KEY_ID,
        teamId: process.env.APP_APPLE_TEAM_ID,
      },
      production: process.env.NODE_ENV === 'production',
    });
    var notif = new apn.Notification();

    notif.expiry = aps.expiry;
    notif.badge = aps.badge;
    notif.sound = aps.sound;
    notif.alert = aps.alert;
    notif.topic = process.env.APP_IOS_BUNDLE_ID;

    if (_.isPlainObject(extra_data)) {
      notif.payload = extra_data;
    }

    provider.send(notif, device_token).then( (ret) => {
      callback(null, ret);
    });
  },

};
