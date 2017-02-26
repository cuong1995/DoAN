function qs(key) {
    key = key.replace(/[*+?^$.\[\]{}()|\\\/]/g, "\\$&"); // escape RegEx meta chars
    var match = location.search.match(new RegExp("[?&]"+key+"=([^&]+)(&|$)"));
    return match && decodeURIComponent(match[1].replace(/\+/g, " "));
}

var access_token = qs('access_token');
var rooms = [];
var config = {
  routes: {
    '/socket/subscribe': onSubscribed,
    '/socket/unsubscribe': onUnsubscribed,
    '/socket/like': onResponse,
    '/socket/comment': onResponse,
  },
  events: {
    'like': onReceivedEvent,
    'comment': onReceivedEvent
  }
};

$(document).ready(function() {
  console.log('Document is ready');

  setupUI();
  setupSockets();

});

function setupUI() {
  refreshViews();

  $('#event-name').unbind().on('input', function(e) {
    refreshViews();
  });

  $('#btn-send').unbind().click(function() {
    var data = {};
    var route = $('#event-name').val();
    var mediaId = $('#media-id').val();
    var content = $('#content').val();

    if (route === '/socket/subscribe') {
      data.type = 'media';
      data.id = mediaId;
    } else if (route === '/socket/unsubscribe') {
      data.type = 'media';
      data.id = mediaId;
    } else if (route === '/socket/like') {
      data.media_id = mediaId;
    } else if (route === '/socket/comment') {
      data.media_id = mediaId;
      data.text = content;
    } else {
      throw new Error('Unknown route: ' + route);
    }

    socketRequest(route, data);
  });
}

function setupSockets() {
  var SailsSocket = io.sails.connect();

  for (var e in config.events) {
    socketHandle(e, config.events[e]);
  }
}

function refreshViews() {
  var route = $('#event-name').val();
  var showContent = (route === '/socket/comment');
  if (showContent) {
    $('#content').removeClass('hidden');
  } else {
    $('#content').addClass('hidden');
  }
}

function onResponse(body, response) {
  showMessage(body, 'success');
}

function onSubscribed(body, response) {
  rooms.push(body);
  rooms = _.uniq(rooms);
  $('#current-room').text(rooms);
}

function onUnsubscribed(body, response) {
  _.pull(rooms, body);
  rooms = _.uniq(rooms);
  $('#current-room').text(rooms);
}

function onReceivedEvent(event, data) {
  var output = data;
  if (data && typeof data !== 'string') {
    output = JSON.stringify(data, undefined, 2);
  }

  showMessage('On received data for event [' + event + ']: data=' + output);
}

function socketRequest(route, data) {
  if (!data) {
    data = {};
  }

  console.log('Emit socket route [' + route + '] with data=' + JSON.stringify(data));

  data.access_token = access_token;

  io.socket.post(route, data, config.routes[route]);
};

function socketHandle(event, handler) {
  io.socket.on(event, handler.bind(undefined, event));
};

// Level: success, warning, danger
function showMessage(msg, level) {
  var output = msg;
  if (msg && typeof msg !== 'string') {
    output = JSON.stringify(msg, undefined, 2);
  }

  if (!level) {
    level = 'warning';
  }

  $('#message-display')
      .removeClass('alert-success')
      .removeClass('alert-warning')
      .removeClass('alert-danger')
      .addClass('alert-' + level)
      .text(output);
}