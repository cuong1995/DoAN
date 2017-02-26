var BaseError = require('./BaseError');

class NotFoundError extends BaseError {

  getDefaultMsg() {
    return 'Not Found';
  }

  getDefaultCode() {
    return 404;
  }

};

module.exports = NotFoundError;
