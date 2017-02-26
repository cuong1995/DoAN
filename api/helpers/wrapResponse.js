var BaseError = require('../errors/BaseError');

module.exports = function(response, code) {
  if (!response) {
    return {
      meta: {
        server_time: new Date(),
        code: code || 200
      },
      data: null
    };
  }

  if (response.meta || response instanceof BaseError) {
    return response;
  }

  var meta = {
    server_time: new Date(),
    code: code || 200,
  };

  if (typeof response === 'string' ||
      typeof response === 'number' ||
      typeof response === 'boolean' ||
      !response || !response.data) {
    response = {
      meta: meta,
      data: response,
      pagination: response ? response.pagination : undefined,
    };
  }

  if (!response.meta) {
    response.meta = meta;
  }

  return response;

};
