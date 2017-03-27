/**
 * Media.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    user_id: {
      type: 'string',
      required: true,
    },
    type: {
      type: 'string',
      required: true,
      enum: ['image', 'video'],
    },
    caption: {
      type: 'string',
    },
    place_id:{
      type:'string',
    },
    comments: {
      type: 'json',
    },
    file_url: {
      type:'array',
      required: true
    },
    is_comment_off:{
      type:'boolean',
      defaultsTo: false,
      required: true
    },
    tag_users: {
      type: 'array',
      required: false,
    },
	title:{
		type:'string'
	},
  }
};
