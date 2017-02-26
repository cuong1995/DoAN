var BaseError = require('./BaseError');

class BadRequestError extends BaseError {

  getDefaultMsg() {
    return 'Bad Request';
  }

  getDefaultCode() {
    return 400;
  }

};

module.exports = BadRequestError;
