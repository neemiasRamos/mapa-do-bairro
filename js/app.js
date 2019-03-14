var map, infowindow;
var markers = [];
var polygon = null;
var placeMarkers = [];
var locais = [
          {
            titulo: 'Parque do Inga', 
            location: {
                lat: -23.4255635, lng: -51.9344253
            }
        },
          {
            titulo: 'Parque do Japao',
            location: {
                lat: -23.4457451, lng: -51.9778566
            }
        },
          {
            titulo: 'Catedral de Maringa', 
            location: {
                lat: -23.4267985, lng: -51.9383348
            }
        },
          {
            titulo: 'Parque Alfredo Werner Nyffeler',
            location: {
                lat: -23.412977, lng: -51.9184518
            }
        },
          {
            titulo: 'Estadio Regional Willie Davids',
            location: {
                lat: -23.413079, lng: -51.9386987
            }
        }
        ];

//erro  
function googleError() {
  alert("Falha ao carregar o mapa");  
}
//inicia
function initMap() {

    var styles = [
    {"featureType": "road","elementType": "geometry.stroke","stylers": [{"color": "#e9e9e9"},
    {"weight": 0.5}]},
    ];
    
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: -23.4131172, lng: -51.9550897},
        zoom: 13,
        styles: styles,
        mapTypeControl: false
    });

    infowindow = new google.maps.InfoWindow();
    var bounds = new google.maps.LatLngBounds();

//cor dos marcadores
    var defaultIcon = makeMarkerIcon('FF4500');

//animação dos marcadores
    locais.forEach(function(location) { 
        var position = location.location;
        var titulo = location.titulo;
        var marker = new google.maps.Marker({
            map: map,
            position: position,
            titulo: titulo,
            icon: defaultIcon,
            animation: google.maps.Animation.DROP,
            description: location.description,
        });
        markers.push(marker);
        bounds.extend(marker.position);
        marker.addListener('click', function() {
            inseriInfoWindow(this, infowindow);
            toggleBounce(this);
            viewModel.clickMarker(location);
            //console.log('click');
        });

        function toggleBounce(marker) {
            if (marker.getAnimation() !== null) {
              marker.setAnimation(null);
            } else {
              marker.setAnimation(google.maps.Animation.BOUNCE);
              setTimeout(function() {
                marker.setAnimation(null)
                }, 2000);
            }
        }   
      
        marker.addListener('mouseout', function() {
            this.setIcon(defaultIcon);
        });
    });

    //aplica bindings do modelo
    var viewModel = new ViewModel();
    ko.applyBindings(viewModel);

    map.fitBounds(bounds);

   
}

function inseriInfoWindow(marker, infowindow) {
        if (infowindow.marker != marker) {
          
          infowindow.setContent('');
          infowindow.marker = marker;
          infowindow.addListener('closeclick', function() {
            infowindow.marker = null;
          });
          var streetViewService = new google.maps.StreetViewService();
          var radius = 50;
          function getStreetView(data, status) {
            if (status == google.maps.StreetViewStatus.OK) {
              var nearStreetViewLocation = data.location.latLng;
              var heading = google.maps.geometry.spherical.computeHeading(
                nearStreetViewLocation, marker.position);
                infowindow.setContent('<div>' + marker.titulo + '</div><div id="pano"></div>');
                var panoramaOptions = {
                  position: nearStreetViewLocation,
                  pov: {
                    heading: heading,
                    pitch: 30
                  }
                };
              var panorama = new google.maps.StreetViewPanorama(
                document.getElementById('pano'), panoramaOptions);
            } else {
              infowindow.setContent('<div>' + marker.titulo + '</div>' +
                '<div>Não temos imagens do Street View</div>');
            }
          }
        streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
          infowindow.open(map, marker);
        }
        marker.addListener('click', function(){
        });
      }

function showListings() {
    var bounds = new google.maps.LatLngBounds();
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
        bounds.extend(markers[i].position);
    }
    map.fitBounds(bounds);
}

// Cria marcadores para cada lugar 
function createMarkersForPlaces(places) {
    var bounds = new google.maps.LatLngBounds();
    for (var i = 0; i < places.length; i++) {
        var place = places[i];
        var icon = {
            url: place.icon,
            size: new google.maps.Size(35, 35),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(15, 34),
            scaledSize: new google.maps.Size(25, 25)
        };


        var marker = new google.maps.Marker({
            map: map,
            icon: icon,
            titulo: place.name,
            position: place.geometry.location,
            id: place.id
        });

//Cria infowindow
        var placeInfoWindow = new google.maps.InfoWindow();
        
        marker.addListener('click', function() {
          console.log('click');
            if (placeInfoWindow.marker == this) {
                console.log("This infowindow already is on this marker");
            } else {
                getPlacesDeatails(this, placeInfoWindow);
            }
        });

        placeMarkers.push(marker);
        if (place.geometry.viewport) {

            bounds.union(place.geometry.viewport);
        } else {
            bounds.extend(place.geometry.location);
        }
    }

    map.fitBounds(bounds);
}

//api da wikipedia
$(function() {
    $(".list-item").on("click", function() {
        var listItem = $(".list-item").val();
        var url = "https://pt.wikipedia.org/w/api.php?action=opensearch&search="+ listItem +"&format=json&callback=?"; 
            $.ajax({
                url: url,
              type: 'GET',
               contentType: "application/json; charset=utf-8",
                async: false,
                dataType: "json",
               success: function(data) {
                    console.log(data[1][0]);
               }
    
        });
    });
});


// coloca marcadores no menu lateral e filtra
var ViewModel = function() {
    var self = this;
    self.placesList = ko.observableArray(locais);
    self.placesList().forEach(function(location, place) {
        location.marker = markers[place];
    });
    self.query = ko.observable('');
    self.filteredPlaces = ko.computed(function() {
    
    return ko.utils.arrayFilter(self.placesList(), function(location) { 
        //console.log(location)
        if (location.titulo.toLowerCase().indexOf(self.query().toLowerCase()) >= 0) {
            location.marker.setVisible(true);
            return true;
        } else { 
            location.marker.setVisible(false);
            infowindow.close();   
            return false;
        }
    });
}, self);

    self.marker = ko.observableArray(markers);
    self.description = ko.observable('');
    self.clickMarker = function(location) {
        inseriInfoWindow(location.marker, infowindow);
        infoWiki();
        location.marker.setAnimation(google.maps.Animation.BOUNCE);
        
        window.setTimeout(function() {
          location.marker.setAnimation(null);
        }, 3000);
        
            function infoWiki(){
            var listItem = location.titulo
            var url = "https://pt.wikipedia.org/w/api.php?action=opensearch&search="+ listItem +"&format=json&callback=?"; 
            var jq = $.ajax({
                url: url,
                type: 'GET',
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function(data) {
                    console.log(data);
                    var titulo = data[0];
                    var para = data[2][0];
                    var url = data[3][0];
                    self.description(
                        'Descricao: <br> '+ titulo +":"+ ' '+ para +
                        '<a href="' + url + '"> </br> Saiba mais </a>'
                        );
                    if(para == null){
                        self.description('Nao encontrei a descricao');
                    }
                },
                error: function(){
                    console.log("Erro Nos dados wikipedia");
                    self.description('<h2>Falha ao requisitar dados<h2>')
                }
            });
        };
    };

}

function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
        'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor + '|40|_|%E2%80%A2',
        new google.maps.Size(34, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(31, 44));
    return markerImage;
}
