/* 
   Node.js server to fetch a GTFS-realtime feed and send it
   to a client over a websocket

   Author: Tyler A. Green (greent@tyleragreen.com)
*/
var http = require('http');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var socketio = require('socket.io');
var GtfsRealtimeBindings = require('gtfs-realtime-bindings');
var request = require('request');
var pg = require('pg');

var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

router.use(bodyParser.json()); // for parsing application/json
router.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Initialize a list of connections to this server
var sockets = [];
var requestSettings = {
  method: 'GET',
  url: 'http://developer.mbta.com/lib/GTRTFS/Alerts/VehiclePositions.pb',
  encoding: null
};

var formatDate = function(date) {
  var days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sept","Oct","Nov","Dec"];
  
  var date_str = days[date.getDay()] + ", " + months[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear() + " " + String("00" + date.getHours()).slice(-2) + ":" + String("00" + date.getMinutes()).slice(-2) + ":" + String("00" + date.getSeconds()).slice(-2)  + " GMT+" + date.getTimezoneOffset();
  
  return date_str;
};

// Set up Express to fetch the client from a subdirectory
router.use(express.static(path.resolve(__dirname, 'client')));

// Start the http server
server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function() {
  var addr = server.address();
  console.log("Server listening at", addr.address + ":" + addr.port);
});

// Fetch the data from the GTFS-realtime source and broadcast it to all 
// connected clients over the socket
var fetchData = function() {
  console.log("Fetching GTFS-realtime info...");
  request(requestSettings, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      var feed = GtfsRealtimeBindings.FeedMessage.decode(body);
      var date = new Date(feed.header.timestamp.low*1000);
     
      // Package the data to send to the client into an object
      var data = {
        date: formatDate(date),
        entities: feed.entity
      };
      console.log(date.toString());

      // Broadcast the data to all connected clients
      sockets.forEach(function(socket) {
        socket.emit('update', data);
      });
    }
  });
};

// Initialize a recurring event to poll the GTFS-realtime source
setInterval(function() {
  fetchData();
}, 18000);

// Save incoming connections and fetch the initial data
io.on('connection', function (socket) {
  sockets.push(socket);
  fetchData();
});