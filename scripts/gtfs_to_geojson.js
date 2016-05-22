var pg = require('pg');
var fs = require('fs');

var connectionString = 'postgres://thebusrider:3ll3board!@gtfs.cotldmpxktwb.us-west-2.rds.amazonaws.com:5432/gtfs';

pg.connect(connectionString, function(err, client, done){
  if (err) {
    console.log(err);
    process.exit(1);
  }
  var routes = {};
  var query = client.query('SELECT * FROM shapes ORDER BY shape_id, shape_pt_sequence'); 
  query.on('row', function(row) {
    if (routes[row.shape_id] == null) {
      routes[row.shape_id] = [row];
    } else {
      routes[row.shape_id].push(row);
    }
  });
  query.on('end', function() {
    var features = [];
    for (var route_key in routes) {
      console.log('route ' + route_key);
      var coordinates = [];
      for (var point in routes[route_key]) {
        console.log(point);
        coordinates.push([point.shape_pt_lon,point.shape_pt_lat]);
      }
      var feature = { 'type':'Feature', 'properties': { 'name':route_key }, 'geometry': {'type':'LineString','coordinates':coordinates}};
      features.push(feature);
    }
    features = {'type':'FeatureCollection','features':features};
    console.log('done'); 
    fs.writeFile('gtfs.geojson',JSON.stringify(features), function(err) {
      if (err) throw err;
      console.log('It\'s saved!');
      process.exit();
    });
  });
});