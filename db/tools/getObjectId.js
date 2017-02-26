var ObjectID = require('mongodb').ObjectID;

module.exports = function(id) {
  var tmpId = ('000000000000' + id.toString());
  var len = tmpId.length;
  var objId = new ObjectID(tmpId.substring(len - 12, len));
  return objId;
};
