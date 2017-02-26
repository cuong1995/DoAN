var path          = require('path');
var util          = require('util');
var fs            = require('fs');
var async         = require('async');
var _             = require('lodash');
var logger        = require('log4js').getLogger();
var MongoClient   = require('mongodb').MongoClient;
var getObjectId   = require('./getObjectId');

var connection = require('../../config/connections').connections['default'],
    url = util.format('mongodb://%s:%s/%s', connection.host, connection.port, connection.database),
    collections = [],
    seeds = {},
    counters = {},
    now = Date.now(),
    db;

function execute() {
  async.auto({
    init: function(next) {
      init(next);
    },
    connect: ['init', function(ret, next) {
      MongoClient.connect(url, next);
    }],
    insert: ['connect', function(ret, next) {
      db = ret.connect;
      processAll(next);
    }]
  }, function(err, ret) {
    if (err) {
      logger.error(err);
      process.exit(1);
      return;
    }

    logger.info('Finish.');
    db.close();
    process.exit(0);
  });
}

function init(callback) {
  var regex = /.js$/i,
      modelDir = path.resolve('.', 'api', 'models'),
      seedDir = path.resolve('.', 'db', 'seeds');

  if (!fs.statSync(modelDir)) {
    throw new Error('Invalid model directory: ' + modelDir);
  }

  if (!fs.statSync(seedDir)) {
    throw new Error('Invalid seed directory: ' + modelDir);
  }

  var modelFiles = fs.readdirSync(modelDir);
  for (var i = 0; i < modelFiles.length; i++) {
    var modelPath = path.join(modelDir, modelFiles[i]);
    var stats = fs.statSync(modelPath);
    if (stats.isFile() && modelPath.match(regex)) {
      collections.push(path.basename(modelPath, '.js').toLowerCase());
    }
  }

  var seedFiles = fs.readdirSync(seedDir);
  for (var i = 0; i < seedFiles.length; i++) {
    var seedPath = path.join(seedDir, seedFiles[i]);
    var stats = fs.statSync(seedPath);
    if (stats.isFile() && seedPath.match(regex)) {
      var collection = path.basename(seedPath, '.js').toLowerCase();
      var seedData = require(seedPath);
      seeds[collection] = seedData;
    }
  }

  callback();
}

function processAll(callback) {
  async.forEach(collections, function(collection, next) {
    counters[collection] = 0;
    processOneCollection(collection, seeds[collection], next);
  }, callback);
}

function processOneCollection(collection, seedData, callback) {
  if (!seedData) {
    return callback();
  }

  var data = seedData.data;

  logger.debug(util.format('Insert %d records into collection: %s', data ? data.length : 0, collection));
  if (!data || !data.length) {
    return callback();
  }

  if (!_.isArray(data)) {
    logger.error('Invalid data format for collection: ' + collection);
    return callback();
  }

  if (seedData.shuffle) {
    data = _.shuffle(data);
  }

  _.each(data, function(doc) {

    var counter = ++counters[collection];

    if (!seedData.autoId) {
      if (!doc._id) {
        doc._id = counter.toString();
      }

      if (doc.seed_id) {
        doc._id = doc.seed_id;
      }

      doc._id = getObjectId(doc._id);
    }

    var random_time = new Date(now + counter * Math.random() * 10000);

    if (!doc.created_time) {
      doc.created_time = random_time;
    }

    if (!doc.updated_time) {
      doc.updated_time = random_time;
    }

  });

  var c = db.collection(collection);

  async.waterfall([
    function clearOldData(next) {
      c.deleteMany({}, next);
    },
    function insertNewData(ret, next) {
      c.insert(data, next);
    },
  ], callback);
}

execute();
