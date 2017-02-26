var passport = require('passport');
var checkit = require('checkit');


module.exports = {

  createComment: function(req, res) {
    var [err, params] = new checkit({
      media_id: ['required'],
      text: ['required', 'string'],
    }).validateSync(req.allParams());

    if (err) {
      return res.badRequest(err.toString());
    }

    sails.log.debug('CommentController::createComment ' +
                      'media_id=' + params.media_id + ',' +
                      'user_id=' + req.user.id + ',' +
                      'text=' + params.text);

    var def = {
      user_id: req.user.id,
      media_id: params.media_id.toString(),
      text: params.text.toString(),
    };

    CommentService.createComment(def, function(err, comment) {
      if (err) {
        return res.serverError(err);
      }

      var roomName = 'media' + '-' + params.media_id;
      comment.from = _.pick(req.user, ['id', 'full_name', 'profile_picture']);
      sails.sockets.broadcast(roomName, 'comment', comment);

      res.ok(comment);
    });
  },

  getComment: function (req,res){
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
          CommentService.getComments({media_id : media_id}, pagination, next);
        },
        pagination: ['data', function (ret, next) {
          PaginationService.genMetaData(ret.data, next);
        }],
      }, function (err, ret) {
        if (err) {
          res.serverError(err);
          return;
        }
        res.ok(ret);
      });
    },

  deleteComment: function (req,res){
    var [err, params] = new checkit({
      media_id: ['required', 'string'],
      comment_id :['required', 'string']
    }).validateSync(req.allParams());

    if (err) {
      res.badRequest(err.toString());
      return;
    }
    params.my_id = req.user.id;
    CommentService.deleteComment(params, function (err) {
      if (err) {
        return res.serverError(err);
      }

      var roomName = 'media' + '-' + params.media_id;
      sails.sockets.broadcast(roomName, 'comment-deleted', {
        media_id: params.media_id,
        comment_id: params.comment_id,
        user_id: req.user.id,
      });

      res.ok('deleted');
    });
  },

}
