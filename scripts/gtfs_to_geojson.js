var pg = require('pg');
var fs = require('fs');
var async = require('async');

var connectionString = 'postgres://thebusrider:3ll3board!@gtfs.cotldmpxktwb.us-west-2.rds.amazonaws.com:5432/gtfs';

var getRouteColors = function(client, callback) {
  var colorsByShapeId = {};
  var colors_query = client.query('SELECT DISTINCT s.shape_id AS shape_id, r.route_color AS route_color FROM routes r JOIN trips t ON r.route_id=t.route_id JOIN shapes s ON t.shape_id=s.shape_id;');
  colors_query.on('row', function(row) {
    colorsByShapeId[row.shape_id] = row.route_color;
  });
  colors_query.on('end', function() {
    callback(colorsByShapeId);
  });
  colors_query.on('error', function(err) {
    console.log(err);
    process.exit(1);
  });
};

var getRoutes = function(client, callback) {
  var routes = {};
  var shapes_query = client.query('SELECT shape_id, shape_pt_lon, shape_pt_lat FROM shapes ORDER BY shape_id, shape_pt_sequence');
  shapes_query.on('row', function(row) {
    if (routes[row.shape_id] == null) {
      routes[row.shape_id] = [row];
    } else {
      routes[row.shape_id].push(row);
    }
  });
  shapes_query.on('end', function() {
    callback(null, routes);
  });
  shapes_query.on('error', function(err) {
    console.log(err);
    process.exit(1);
  });
};

pg.connect(connectionString, function(err, client, done){
  if (err) {
    console.log(err);
    process.exit(1);
  }
  
  async.parallel([
    function(callback) { 
      getRoutes(client, callback)
    },
    function(callback) { 
      getRouteColors(client, callback)
    }], function(err, results) {
      if (err) {
        console.log(err);
        process.exit(1);
      }
      
      var routes = results[0];
      var colors = results[1];
      
      var features = [];
      for (var shape_id in routes) {
        var color = colors[shape_id];
        var coordinates = [];
        routes[shape_id].forEach(function(row) {
          coordinates.push([row.shape_pt_lon,row.shape_pt_lat]);
        });
        var feature = { 'type':'Feature', 'properties': { 'name':shape_id,'stroke':color }, 'geometry': {'type':'LineString','coordinates':coordinates}};
        features.push(feature);
      }
      features = {'type':'FeatureCollection','features':features};
      console.log('done'); 
      fs.writeFile('gtfs.geojson',JSON.stringify(features), function(err) {
        if (err) throw err;
        console.log('It\'s saved!');
        process.exit(0);
      });
  });
});
