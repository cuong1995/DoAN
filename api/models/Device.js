module.exports = {

  attributes: {
    user_id: {
      type: 'string',
      required: true,
    },
    device_id: {
      type: 'string',
      required: true,
    },
    device_token: {
      type: 'string',
      required: true,
    },
    os: {
      type: 'string',
      required: true,
      enum: ['android', 'ios'],
    }
  },

};
