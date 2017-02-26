var passport = require('passport');
var checkit = require('checkit');

module.exports = {

  createLike: function(req, res) {
    var [err, params] = new checkit({
      media_id: ['required'],
    }).validateSync(req.allParams());

    if (err) {
      return res.badRequest(err.toString());
    }

    sails.log.debug('LikeController::createLike ' +
                      'media_id=' + params.media_id + ',' +
                      'user_id=' + req.user.id);

    var likeDef = {
      user_id: req.user.id,
      media_id: params.media_id.toString(),
    };

    LikeService.createLike(likeDef, function(err, like) {
      if (err) {
        return res.serverError(err);
      }

      var roomName = 'media' + '-' + params.media_id;
      like.from = _.pick(req.user, ['id', 'full_name', 'profile_picture']);
      sails.sockets.broadcast(roomName, 'like', like);

      res.ok(like);
    });
  },

  getLikeUser: function (req,res){
    var [err, params] = new checkit({
      media_id: ['required', 'string'],
    }).validateSync(req.allParams());

    if (err) {
      res.badRequest(err.toString());
      return;
    }
    var media_id = params.media_id,
        pagination = PaginationService.parse(req.query);
    async.auto({
      data: function (next) {
        LikeService.getLikeUser(req.user, {media_id : media_id}, pagination, next);
      },
      pagination: ['data', function (ret, next) {
        PaginationService.genMetaData(ret.data, next);
      }],
    }, function (err, ret) {
      if (err) {
        res.serverError(err);
        return;
      }
      if (!ret.data) {
        return  res.ok({data : []});
      }
      res.ok(ret);
    });
  },

  deleteLike: function (req,res){
    var [err, params] = new checkit({
      media_id: ['required', 'string'],
    }).validateSync(req.allParams());

    if (err) {
      res.badRequest(err.toString());
      return;
    }
    params.my_id = req.user.id;
    LikeService.deleteLike(params, function (err) {
      if (err) {
        return res.serverError(err);
      }

      var roomName = 'media' + '-' + params.media_id;
      sails.sockets.broadcast(roomName, 'like-deleted', {
        media_id: params.media_id,
        user_id: req.user.id,
      });

      res.ok('deleted');
    });
  },

}
