module.exports = {

  getFeed: function(user_id, options, callback) {
    async.auto({
      followedUserIds: function(next) {
        FollowerService.getIdolIds(user_id, options, next);
      },
      medias: ['followedUserIds', function(ret, next) {
        MediaService.getMedias({user_id: _.concat(ret.followedUserIds, user_id)}, options, next);
      }],
    }, function(err, ret) {
      if (err) {
        callback(err);
        return;
      }
      var medias = ret.medias;
      if (!medias || !medias.length) {
        callback(null, []);
        return;
      }
      callback(null, medias);
    });
  }

}
