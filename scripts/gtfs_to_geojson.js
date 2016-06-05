var pg = require('pg');
var fs = require('fs');

var connectionString = 'postgres://thebusrider:3ll3board!@gtfs.cotldmpxktwb.us-west-2.rds.amazonaws.com:5432/gtfs';

pg.connect(connectionString, function(err, client, done){
  if (err) {
    console.log(err);
    process.exit(1);
  }
  var routes = {};
  var shapes_query = client.query('SELECT * FROM shapes ORDER BY shape_id, shape_pt_sequence'); 
  shapes_query.on('row', function(row) {
    if (routes[row.shape_id] == null) {
      routes[row.shape_id] = [row];
    } else {
      routes[row.shape_id].push(row);
    }
  });
  shapes_query.on('end', function() {
    var features = [];
    for (var shape_id in routes) {
      console.log('route ' + shape_id);
      var coordinates = [];
      routes[shape_id].forEach(function(row) {
        coordinates.push([row.shape_pt_lon,row.shape_pt_lat]);
      });
      var color_query = client.query("SELECT DISTINCT r.route_color FROM routes r JOIN trips t ON r.route_id=t.route_id JOIN shapes s ON t.shape_id=s.shape_id WHERE s.shape_id='$1'", [shape_id]);
      var color = null;
      color_query.on('row',function(row){
        color = row.route_color;
        console.log(color);
        var feature = { 'type':'Feature', 'properties': { 'name':shape_id,'stroke':color }, 'geometry': {'type':'LineString','coordinates':coordinates}};
        features.push(feature);
      });
    }
    while (features.length != routes.length) { }
    features = {'type':'FeatureCollection','features':features};
    console.log('done'); 
    fs.writeFile('gtfs.geojson',JSON.stringify(features), function(err) {
      if (err) throw err;
      console.log('It\'s saved!');
      process.exit();
    });
  });
});