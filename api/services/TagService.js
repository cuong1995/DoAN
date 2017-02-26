module.exports = {
  extractTagsFromString: function(caption) {
    if (!caption) {
      return [];
    }

    return _.map(caption.match(/#\w+/g), function(tag) { return _.trimStart(tag, '#') });
  },

  getOneByName: function(name, callback) {
    this._get({ name: name }, callback);
  },

  getRecentMediasByTag: function(name, pagination, callback) {
    async.auto({
      tags: function (next) {
        PaginationService.exec(Tag.find({ name: name }), pagination, next);
      },
      medias: ['tags', function (ret, next) {
        MediaService.getMedias(_.map(ret.tags, 'media_id'), {}, next);
      }],
    }, function(err, ret) {
      if (err) {
        return callback(err);
      }
      callback(null, ret);
    });
  },

  search: function(query, callback) {
    this._get({ name: { $regex : '.*' + query + '.*'} }, callback);
  },

  _get: function(query, callback) {
    Tag.native(function(err, collection) {
      if (err) return callback(err, null);
      collection.aggregate([
        {"$match" : query},
        {"$group" : {_id:"$name", count:{$sum:1}}}])
      .toArray(function(err, tags) {
        if (_.isEmpty(tags)) return callback();
        callback(null, _.map(tags, function(tag) {
          return { name: tag._id, count: tag.count }
        }));
      });
        });
  },

  attachTags: function(media_id, tags, callback) {
    if (_.isEmpty(tags)) return callback(null, []);
    Tag.create(_.map(tags, function(tag) {
      return { media_id: media_id, name: tag };
    }), callback);
  },

  cleanTags: function(media_id, tags, callback) {
    if (_.isEmpty(tags)) return callback(null, []);
    Tag.destroy({ media_id: media_id, name: { '!': tags } }, callback);
  },

  updateTags: function(media, current_tags, callback) {
    var tags = TagService.extractTagsFromString(media.caption);
    async.auto({
      currentTags: function(next) {
        if (current_tags) return next(null, current_tags);

        Tag.find({ media_id: media.id }).exec(function(err, tags) {
          if (err) return next(err);
          next(null, _.map(tags, "name"));
        });
      },
      attachTags: ['currentTags', function(ret, next) {
        var need_add_tags = _.filter(tags, function(n) {
          return !_.includes(ret.currentTags, n);
        });
        TagService.attachTags(media.id, need_add_tags, next);
        }],
        cleanTags: ['currentTags', function(ret, next) {
          TagService.cleanTags(media.id, tags, next);
        }],
      }, function(err, ret) {
        if (err) {
          return callback(err);
        }
        callback(null, tags);
      });
  },
}