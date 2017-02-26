var generator     = require('lorem-ipsum');
var _             = require('lodash');
var users         = require('./user').data;
var medias        = require('./media').data;
var getObjectId   = require('../tools/getObjectId');

var user_ids = _.map(users, function(user) {
  return getObjectId(user.seed_id).toString();
});

var count = 100, // Number of comments will be generated
    media_ids = [],
    data = [];

for (var i = 1; i <= medias.length; i++) {
  media_ids.push(getObjectId(i).toString());
}

for (var i = 0; i < count; i++) {
  data.push({
    user_id: _.sample(user_ids),
    media_id: _.sample(media_ids),
    text: generator(),
  });
}

module.exports = {
  connection: 'default',
  shuffle: true,
  data: data,
};
