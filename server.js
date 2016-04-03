var http = require('http');
var path = require('path');

var express = require('express');
var socketio = require('socket.io');
var GtfsRealtimeBindings = require('gtfs-realtime-bindings');
var request = require('request');

var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

var sockets = [];

var requestSettings = {
  method: 'GET',
  url: 'http://developer.mbta.com/lib/GTRTFS/Alerts/VehiclePositions.pb',
  encoding: null
};

router.use(express.static(path.resolve(__dirname, 'client')));

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function() {
  var addr = server.address();
  console.log("Server listening at", addr.address + ":" + addr.port);
});

setInterval(function() {
  console.log("Fetching API...");
  request(requestSettings, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      var feed = GtfsRealtimeBindings.FeedMessage.decode(body);
      var date = new Date(feed.header.timestamp.low*1000);
      var data = {
        date: date.toString(),
        entities: feed.entity
      };
      console.log(date.toString());
      sockets.forEach(function(socket) {
        socket.emit('update',data);
      });
    }
  });
}, 5000);

io.on('connection', function (socket) {
  sockets.push(socket);
});
