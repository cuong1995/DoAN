var _ = require('lodash');
var getObjectId = require('../tools/getObjectId');
var users = require('./user').data;
var medias = require('./media').data;

var user_ids = _.map(users, function(user) {
  return getObjectId(user.seed_id).toString();
});

var data = [],
    media_counter = 0;

_.each(medias, function(media) {
  var media_id = getObjectId(++media_counter).toString(),
      liked_user_ids = [],
      likeCount = _.random(0, user_ids.length);

  for (var i = 0; i < likeCount; i++) {
    liked_user_ids.push(_.sample(user_ids));
  }

  liked_user_ids = _.uniq(liked_user_ids);
  data = data.concat(_.map(liked_user_ids, function(user_id) {
    return {
      media_id: media_id,
      user_id: user_id,
    }
  }));

});

module.exports = {
  connection: 'default',
  autoId: true,
  shuffle: true,
  data: data,
};
