/**
 * Default model configuration
 * (sails.config.models)
 *
 * Unless you override them, the following properties will be included
 * in each of your models.
 *
 * For more info on Sails models, see:
 * http://sailsjs.org/#!/documentation/concepts/ORM
 */

module.exports.models = {

  /***************************************************************************
  *                                                                          *
  * Your app's default connection. i.e. the name of one of your app's        *
  * connections (see `config/connections.js`)                                *
  *                                                                          *
  ***************************************************************************/
  // connection: 'localDiskDb',
  connection: 'default',

  /***************************************************************************
  *                                                                          *
  * How and whether Sails will attempt to automatically rebuild the          *
  * tables/collections/etc. in your schema.                                  *
  *                                                                          *
  * See http://sailsjs.org/#!/documentation/concepts/ORM/model-settings.html  *
  *                                                                          *
  ***************************************************************************/
  // migrate: 'alter'
  migrate: 'safe',

  autoCreatedAt: false,
  autoUpdatedAt: false,
  attributes: {
    created_time: {
      type: 'datetime',
      defaultsTo: function() {return new Date();}
    },
    updated_time: {
      type: 'datetime',
      defaultsTo: function() {return new Date();}
    }
  },

  //Resonsible for actually updating the 'updated_time' property.
  beforeValidate:function(values, next) {
    values.updated_time = new Date();
    next();
  },

};
