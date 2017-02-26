/**
 * UserController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var checkit = require('checkit');

function getRoomName(type, id) {
  return type + '-' + id;
}

module.exports = {

  subscribe: function(req, res) {
    if (!req.isSocket) {
      return res.badRequest('This route should be requested via socket only.');
    }

    var [err, params] = new checkit({
      type: ['required', 'string'],
      id: ['required', 'string'],
    }).validateSync(req.allParams());

    if (err) {
      sails.log.error(err.toString());
      return res.badRequest(err.toString());
    }

    sails.log.debug('SocketController::subscribe type=' + params.type + ', id=' + params.id + ', user_id=' + req.user.id);

    var roomName = getRoomName(params.type, params.id);

    sails.sockets.join(req, roomName, function(err) {
      if (err) {
        return res.serverError(err);
      }

      return res.send(roomName);
    });
  },

  unsubscribe: function(req, res) {
    if (!req.isSocket) {
      return res.badRequest('This route should be requested via socket only.');
    }

    var [err, params] = new checkit({
      type: ['required', 'string'],
      id: ['required', 'string'],
    }).validateSync(req.allParams());

    if (err) {
      sails.log.error(err.toString());
      return res.badRequest(err.toString());
    }

    sails.log.debug('SocketController::unsubscribe type=' + params.type + ', id=' + params.id + ', user_id=' + req.user.id);

    var roomName = getRoomName(params.type, params.id);

    sails.sockets.leave(req, roomName, function(err) {
      if (err) {
        return res.serverError(err);
      }

      return res.send(roomName);
    });
  },



};
