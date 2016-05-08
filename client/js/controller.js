function Controller($scope, $http) {
  var socket = io.connect();
  var lat = '';
  var long = '';
  var vehicles = {};
  var markers = {};
  
  $scope.last_updated = '';
  L.mapbox.accessToken = 'pk.eyJ1IjoiZ3JlZW50IiwiYSI6ImNpazBqdWFsOTM5Nnh2M2x6dWZ2dnB3aHkifQ.97-pFPD8lQf02B6edag1rA';
  var map = L.mapbox.map('map', 'mapbox.streets')
      .setView([42.358056, -71.063611], 10);
  var markerLayer = L.mapbox.featureLayer().addTo(map);
  
  $.getJSON('gtfs.geojson', function(data) { 
    var geojson = L.geoJson(data, {
      style: { fillColor: 'blue' }
    }).addTo(map);
  });
  
  markerLayer.on('click', function(e) {
    $http.get('/api/v1/todos')
      .success(function(data){
        $scope.trip_id = data;
        console.log(data);
      })
      .error(function(error) {
        console.log('Error: ' + error);
      });
    //$scope.trip_id = e.layer.tripId;
    $scope.$apply();
    $('.sidePanel').addClass('sideOpen');
  });
  
  $('.closePanel').on('click', function() {
    $('.sidePanel').removeClass('sideOpen');
  });
  
  socket.on('update', function(data) {
    $scope.last_updated = data.date;
    data.entities.forEach(function(entity) {
      var properties = {
        lat: entity.vehicle.position.latitude,
        long: entity.vehicle.position.longitude
      };
      vehicles[entity.vehicle.vehicle.id] = properties;
      if (markers[entity.vehicle.vehicle.id] == null) {
        var marker = L.marker([properties.lat, properties.long], {
  	  icon: L.mapbox.marker.icon({
  	    'marker-color': '#f86767'
  	  })
        });
        marker.tripId = entity.vehicle.trip.trip_id;
        markerLayer.addLayer(marker);
        markers[entity.vehicle.vehicle.id] = marker;
      }
      else
      {
        markers[entity.vehicle.vehicle.id].setLatLng(L.latLng(properties.lat,properties.long));
      }
    });
    $scope.$apply();
  });
}