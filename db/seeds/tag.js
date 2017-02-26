var _ = require('lodash');
var getObjectId = require('../tools/getObjectId');
var medias    = require('./media').data;

var tags = ['awesome', 'amazing', 'beautiful', 'cute', 'pretty', 'hot'],
    media_ids = [],
    data = [];

var data = [],
    media_counter = 0;

_.each(medias, function(media) {
  var media_id = getObjectId(++media_counter).toString(),
      media_tags = [],
      tagCount = _.random(0, tags.length);

  for (var i = 0; i < tagCount; i++) {
    media_tags.push(_.sample(tags));
  }

  media_tags = _.uniq(media_tags);
  data = data.concat(_.map(media_tags, function(tag) {
    return {
      media_id: media_id,
      name: tag,
    }
  }));

});

module.exports = {
  connection: 'default',
  autoId: true,
  shuffle: true,
  data: data,
};
