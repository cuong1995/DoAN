class BaseError {

  constructor(msg, code) {
    this._msg = msg || this.getDefaultMsg();
    this._code = code || this.getDefaultCode();
  }

  getDefaultMsg() {
    return 'Unknown Server Error';
  }

  getDefaultCode() {
    return 500;
  }

  getCode() {
    return this._code;
  }

  getMsg() {
    return this._msg;
  }

};

module.exports = BaseError;
