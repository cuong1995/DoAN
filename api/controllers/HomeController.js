/**
 * UserController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

  homepage: function(req, res) {
    res.view('homepage', {user: req.user});
  }

};
