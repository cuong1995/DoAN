/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes map URLs to views and controllers.
 *
 * If Sails receives a URL that doesn't match any of the routes below,
 * it will check for matching files (images, scripts, stylesheets, etc.)
 * in your assets directory.  e.g. `http://localhost:1337/images/foo.jpg`
 * might match an image file: `/assets/images/foo.jpg`
 *
 * Finally, if those don't match either, the default 404 handler is triggered.
 * See `api/responses/notFound.js` to adjust your app's 404 logic.
 *
 * Note: Sails doesn't ACTUALLY serve stuff from `assets`-- the default Gruntfile in Sails copies
 * flat files from `assets` to `.tmp/public`.  This allows you to do things like compile LESS or
 * CoffeeScript for the front-end.
 *
 * For more information on configuring custom routes, check out:
 * http://sailsjs.org/#!/documentation/concepts/Routes/RouteTargetSyntax.html
 */

module.exports.routes = {

  /***************************************************************************
  *                                                                          *
  * Make the view located at `views/homepage.ejs` (or `views/homepage.jade`, *
  * etc. depending on your default view engine) your home page.              *
  *                                                                          *
  * (Alternatively, remove this and add an `index.html` file in your         *
  * `assets` directory)                                                      *
  *                                                                          *
  ***************************************************************************/

  '/': 'HomeController.homepage',

  /***************************************************************************
  *                                                                          *
  * Custom routes here...                                                    *
  *                                                                          *
  * If a request to a URL doesn't match any of the custom routes above, it   *
  * is matched against Sails route blueprints. See `config/blueprints.js`    *
  * for configuration options and examples.                                  *
  *                                                                          *
  ***************************************************************************/

  'get /login': {
    view: 'login'
  },

  'get /debug-socket': 'DebugController.socketPage',

  // Original FB authentication way
  'get  /auth/facebook_origin': 'AuthController.facebookOrigin',
  'get  /auth/facebook/callback': 'AuthController.fbCallback',

  // A bit tricky but more convenient way
  'get  /auth/facebook': 'AuthController.facebook',
  'post /auth/facebook': 'AuthController.facebook',

  // Get /logout will redirect to /
  // Post /logout will return json format
  'get  /logout': 'AuthController.logoutAndRedirect',
  'post /logout': 'AuthController.logout',

  'post /avatar': 'UserController.updateAvatar',
  'post /profile': 'UserController.updateProfile',
  'post /device-id': 'UserController.addDeviceId',

  // PUSH NOTIFICATION
  'post /push-notification/ios': 'DebugController.sendAPN',
  'post /push-notification/android': 'DebugController.sendGCM',

  // Newsfeed
  'get /newsfeed': 'NewsFeedController.data',

  // LIKE CONTROLLER
  'get /media/:media_id/likes': 'LikeController.getLikeUser',
  'post /media/:media_id/likes': 'LikeController.createLike',
  'delete /media/:media_id/likes': 'LikeController.deleteLike',

  // COMMENT CONTROLLER
  'get /media/:media_id/comments': 'CommentController.getComment',
  'post /media/:media_id/comments': 'CommentController.createComment',
  'delete /media/:media_id/comments/:comment_id': 'CommentController.deleteComment',

  // MEDIA CONTROLLER
  'get /media/search': 'MediaController.searchByLocation',
  'get /media/:id': 'MediaController.getOne',
  'post /media': 'MediaController.createOne',
  'post /media/:id': 'MediaController.updateOne',
  'delete /media/:id':'MediaController.deleteOne',

  // LOCATION CONTROLLER
  'get /locations/search':'LocationController.search',
  'get /locations/:place_id' : 'LocationController.getLocationById',
  'get /locations/:place_id/media/recent': 'LocationController.getMediaOfLocation',
  'post /locations':'LocationController.createLocation',
  'post /locations/updateLocation':'LocationController.updateLocation',
  'get /location/user/:user_id' : 'LocationController.getLocationOfUser',

  //USER CONTROLLER
  'get /users/self':'UserController.self',
  'get /users/search' : 'UserController.search',
  'get /users/:user_id':'UserController.getById',
  'get /users/self/media/recent':'UserController.getRecentMedias',
  'get /users/:user_id/media/recent':'UserController.getRecentMedias',
  'get /users/self/media/liked' : 'UserController.getLikedMedias',
  'get /random_users': 'UserController.getRandomUsers',
  'get /users/:user_id/tagged-in': 'UserController.getMediaTaggedIn',

  //FOLLOWER CONTROLLER
  'get /users/self/follows':'FollowerController.getMyIdols',
  'get /users/self/followed-by':'FollowerController.getMyFollowers',
  'get /users/self/requested-by':'FollowerController.getRequestedBy',
  'get /users/:user_id/relationship':'FollowerController.getRelationship',
  'get /users/:user_id/follows':'FollowerController.getIdols',
  'get /users/:user_id/followed-by':'FollowerController.getFollowers',
  'post /users/:user_id/relationship':'FollowerController.updateRelationship',

  //TAG CONTROLLER
  'get /tags/search': 'TagController.search',
  'get /tags/:tag_name': 'TagController.getByName',
  'get /tags/:tag_name/media/recent': 'TagController.getRecentMedias',

  // SOCKET
  // '/socket/subscribe': 'SocketController.subscribe',
  // '/socket/unsubscribe': 'SocketController.unsubscribe',
  '/socket/like': 'LikeController.createLike',
  '/socket/comment': 'CommentController.createComment',
};
