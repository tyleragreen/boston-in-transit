/*
  Script to load a GTFS feed into a Postgres database
  
  Author: Tyler Green (greent@tyleragreen.com)
*/
var pg = require('pg');
var csv = require('csv');
var fs = require('fs');

var connectionString = 'postgres://thebusrider:3ll3board!@gtfs.cotldmpxktwb.us-west-2.rds.amazonaws.com:5432/gtfs';
var files = ['agency','calendar','calendar_dates','feed_info','frequencies','routes','shapes','stop_times','stops','transfers','trips'];
pg.connect(connectionString, function(err, client, done){
  if (err) {
    done();
    console.log(err);
  }
  console.log('Connected!');
  
  var filepath = '/home/ubuntu/workspace/transit-realtime/downloads/routes.txt';
  fs.access(filepath, fs.R_OK | fs.W_OK, function(err){
    if (err) {
      console.log('Could not find file: ' + filepath);
    }
    
      console.log('Importing file: ' + filepath);
      
      var input = fs.createReadStream(filepath);
      
      var parser = csv.parse({
         columns: true,
         relax: true
      });
      
      parser.on('readable', function() {
        while (line = parser.read()) {
          var query = client.query("INSERT INTO routes (id) VALUES($1)", [line.route_id]);
          
          query.on('error', function(e) {
             console.log(e.stack); 
             process.exit(1);
          });
        };
      });
      parser.on('error', function(err){
        console.log('Error: ' + error);
        process.exit(1);
      });
      input.pipe(parser);
  });
});