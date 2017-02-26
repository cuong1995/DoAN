/**
 * NewsFeedController
 *
 * @description :: Server-side logic for managing Newsfeeds
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

  data: function (req, res) {
    var user_id = req.user.id,
        options = {
          pagination: PaginationService.parse(req.query),
          check_liked_uid: req.user.id,
        };
    async.auto({
      data: function(next) {
        NewsFeedService.getFeed(user_id, options, next);
      },
      pagination: ['data', function (ret, next) {
        PaginationService.genMetaData(ret.data, next);
      }],
    }, function(err, ret) {
      if (err) {
        res.serverError(err);
        return;
      }

      res.ok(ret);
    });
  }

};

