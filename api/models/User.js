/**
 * User.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

var bcrypt = require('bcrypt');

module.exports = {

  attributes: {
    fbid: {
      type: 'string',
      unique: true,
    },
    provider: {
      type: 'string'
    },
    email: {
      type: 'email',
      unique: true
    },
    full_name: {
      type: 'string'
    },
    profile_picture: {
      type: 'string'
    },
    bio: {
      type: 'string'
    },
    website: {
      type: 'string'
    },
    phone: {
      type: 'string'
    },
    gender: {
      type: 'string'
    }
  },

};
