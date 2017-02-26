var BaseError = require('./BaseError');
var NotFoundError = require('./NotFoundError');
var BadRequestError = require('./BadRequestError');

module.exports = {

  notFound: function(msg, code) {
    return new NotFoundError(msg, code);
  },

  badRequest: function(msg, code) {
    return new BadRequestError(msg, code);
  },

  internal: function(msg, code) {
    return new BaseError(msg, code);
  },

};
