var passport = require('passport');
var jwtStrategy = require('passport-jwt').Strategy;
var jwt = require("jsonwebtoken");
var request = require('request');
var async = require('async');
var crypto = require('crypto');
var logger = require('log4js').getLogger('AuthController');
var constants = require('../../config/constants');

function generateAccessToken(user, expiredTime) {
  expiredTime = expiredTime || constants.DAY_IN_SECONDS * 30;

  return jwt.sign({
    id: user.id
  }, process.env.SECRET, { expiresIn: expiredTime });
}

module.exports = {

  _config: {
    actions: false,
    shortcuts: false,
    rest: false
  },

  facebook: function(req, res, next) {
    var fb_access_token = req.param('fb_access_token'),
        secret = process.env.FACEBOOK_APP_SECRET,
        hash = crypto.createHmac('sha256', secret).update(fb_access_token),
        appsecret_proof = hash.digest('hex'),
        fields = 'id,name,email,gender,link,picture.type(large)';
        url = util.format('https://graph.facebook.com/v2.8/me?fields=%s&access_token=%s&appsecret_proof=%s', fields, fb_access_token, appsecret_proof),
        fbid = '';

    async.auto({
      fbInfo: function(next) {
        request({
          json: true,
          url: url
        }, next);
      },
      existedUser: ['fbInfo', function(ret, next) {
        var result = ret.fbInfo;
        if (ret.fbInfo && ret.fbInfo.length && ret.fbInfo[0].statusCode === 200) {
          fbid = ret.fbInfo[1].id;
          User.findOne({
            fbid: fbid
          }, next);
          return;
        }
        next('FB authentication failed.');
      }],
      user: ['existedUser', function(ret, next) {
        // If user that associated with fb account is existed, just continue
        if (ret.existedUser) {
          next(null, ret.existedUser);
          return;
        }

        var profile = ret.fbInfo[1];
        var data = {
          fbid: profile.id,
          provider: 'facebook',
          email: profile.email,
          full_name: profile.name,
          profile_picture: profile.picture.data.url,
          bio: profile.about,
          website:profile.link
        };

        User.create(data, next);

      }],
    }, function(err, ret) {
      if (err) {
        res.serverError(err);
        return;
      }

      if (!ret.user) {
        res.internal('Cannot find or create user');
        return;
      }

      var user = ret.user,
          token = generateAccessToken(user);

      res.ok({
        user: user,
        token: token
      });
    });
  },

  logout: function(req, res) {
    req.logout();
    res.ok('Logged out');
  },

  logoutAndRedirect: function(req, res) {
    // TODO: revoke using token
    req.logout();
    res.redirect('/');
  },

  facebookOrigin: function(req, res, next) {
    passport.authenticate('facebook')(req, res, next);
  },

  fbCallback: function(req, res) {
    console.log('AuthController::fbCallback');
    passport.authenticate('facebook', {
      failureRedirect: '/?error=failureSnsLoginFailure'
    })(req, res, function(err, ret) {
      if (err) {
        console.log('[ERROR] AuthController::fbCallback err=' + util.inspect(err));
        res.redirect('/');
        return;
      }

      var user = req.user,
          token = generateAccessToken(user);

      res.ok({
        user: user,
        token: token
      });
    });
  },

};
