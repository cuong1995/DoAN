var _ = require('lodash');
var getObjectId = require('../tools/getObjectId');
var users = require('./user').data;
var user_ids = _.map(users, function(user) {
  return getObjectId(user.seed_id).toString();
});

var data = [];
_.each(user_ids, function(user_id) {
  var count = _.random(0, user_ids.length),
      follower_ids = [];

  for (var i = 0; i < count; i++) {
    follower_ids.push(_.sample(user_ids));
  }

  follower_ids = _.without(_.uniq(follower_ids), user_id);
  data = data.concat(_.map(follower_ids, function(follower_id) {
    return {
      user_id: user_id,
      follower_id: follower_id,
      status: true,
    }
  }));

});

module.exports = {
  connection: 'default',
  shuffle: true,
  data: data,
};
