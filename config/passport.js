var passport = require('passport'),
    FacebookStrategy = require('passport-facebook'),
    LocalStrategy = require('passport-local').Strategy,
    JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt,
    bcrypt = require('bcrypt'),
    util = require('util');

var jwtOpts = {
  secretOrKey: process.env.SECRET,
  jwtFromRequest: function(req) {
    token = req.headers['x-access-token'];
    if (token && token.length > 0) {
      return token;
    }

    return req.param('access_token') || req.param('auth_token');
  },
};

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findOne({ id: id } , function (err, user) {
    done(err, user);
  });
});


passport.use( 'jwt', new JwtStrategy(jwtOpts,
  function(jwt_payload, done) {
    sails.log.debug('Passport::jwt callback jwt_payload=' + JSON.stringify(jwt_payload));
    User.findOne({
      id: jwt_payload.id
    }, function(err,user) {
      if (err){
        return done(err, false);
      }

      done(null, user);
    });
  }
));

var verifyHandler = function(req, token, tokenSecret, profile, done) {
  sails.log.debug('Passport::verifyHandler token=' + token);
  sails.log.debug('Passport::verifyHandler profile=' + util.inspect(profile));
  process.nextTick(function() {

    User.findOne({fbid: profile.id}, function(err, user) {
      if (user) {
        console.log('Passport::verifyHandler got user=' + util.inspect(user));
        return done(null, user);
      } else {

        var data = {
          provider: profile.provider,
          fbid: profile.id,
          full_name: profile.name,
          profile_picture: profile.picture.data.url,
          website: profile.link
        };

        if (profile.emails && profile.emails[0] && profile.emails[0].value) {
          data.email = profile.emails[0].value;
        }

        User.create(data, function(err, user) {
          console.log('Passport::verifyHandler created user=' + util.inspect(user));
          return done(err, user);
        });
      }
    });
  });
};

passport.use('facebook', new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: process.env.APP_ENDPOINT + "/auth/facebook/callback",
  passReqToCallback : true
}, verifyHandler));
