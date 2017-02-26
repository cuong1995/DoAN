var getObjectId = require('../tools/getObjectId');

module.exports = {
  connection: 'default',
  shuffle: true,
  data: [
    {
      user_id: getObjectId(1).toString(),
      device_id: 'abc123',
      device_token: '489D79FAA35E8D06112C5FC531BB8CB27223927672B048777EF68E2B876C505A',
      os: 'ios',
    },
    {
      user_id: getObjectId(1).toString(),
      device_id: 'abc124',
      device_token: 'INVALID',
      os: 'ios',
    }
  ]
}