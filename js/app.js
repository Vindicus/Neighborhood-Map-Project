var map;
var store;
var result = new Array();
var markers = ko.observableArray([]);
var infowindow;

// Preparing markers and infowindow content
function pinMarkers(restaurant) {
    for(var i = 0; i < restaurant.length; i++) {
        restaurant[i].restaurantPin = new google.maps.Marker({
            position: new google.maps.LatLng(restaurant[i].latitude, restaurant[i].longitude),
            map: map,
            icon: {
                url: 'img/marker.png'
            }
        });

        //Creates a DOM element to be bind to infowindow
        restaurant[i].contentString = '<p style="font-weight:bold;">' + restaurant[i].business + '</p>'+
            '<p>Phone: '+ restaurant[i].phone + '</p>' +
            '<p>latitude: '+ restaurant[i].latitude + '</p>' +
            '<p>longitude: '+ restaurant[i].longitude + '</p>' +
            '<a href="'+restaurant[i].yelp+'"> Additional Info</a>';

            infowindow = new google.maps.InfoWindow({
                content: restaurant[i].contentString
            });
        
            // Closure to add click event for each marker
            // Click marker to view infoWindow
        new google.maps.event.addListener(restaurant[i].restaurantPin, 'click', (function(marker, i) {
            return function() {
                infowindow.setContent(restaurant[i].contentString);
                infowindow.open(map,this);
                console.log(restaurant[i].business);
                for(var x = 0; x < restaurant.length; x++){
                    if(restaurant[x].business == restaurant[i].business){
                        marker.setIcon("img/marker2.png");
                        restaurant[i].restaurantPin.setAnimation(google.maps.Animation.BOUNCE);
                    }else{
                        restaurant[x].restaurantPin.setIcon("img/marker.png");
                        restaurant[x].restaurantPin.setAnimation(null);
                    }
                }
            };
        })(restaurant[i].restaurantPin, i));
    }
}

//STARTING YELP API
var auth = {
    consumerKey: 'Ka4UYkp08pajShmFCHFmTg',
    consumerSecret: '_YOmD4eKQbgZMO023HkCBoAw0Nc',
    accessToken: '8-A-3qBbuSKa46Nsgsj_P0YEG17AofwL',
    accessTokenSecret: 'VvR-f_zreXyS01h9VR9Cf1q_HEw',
    signatureMethod : "HMAC-SHA1"
};

// accessor for signing the method "HMAC-SHA1"
var accessor = {
    consumerSecret : auth.consumerSecret,
    tokenSecret : auth.accessTokenSecret
};

// input optional parameters for Yelp API
var requestedParams = {
    term: 'restaurants',
    ll: "37.773972, -122.431297",
    sort: 1,
    category_filter: 'chinese',
    radius_filter: 10000,
    limit: 10,
    callback: 'callback',
    oauth_consumer_key: auth.consumerKey,
    oauth_consumer_secret: auth.consumerSecret,
    oauth_token: auth.accessToken,
    oauth_signature_method: auth.signatureMethod
}

// ajax API required parameters for retrieving results
var ajaxParams = {
    'action' : 'https://api.yelp.com/v2/search',
    'method' : 'GET',
    'parameters' : requestedParams
};

//OAuth required parameters
OAuth.setTimestampAndNonce(ajaxParams);
OAuth.SignatureMethod.sign(ajaxParams, accessor);

// Yelp API ajax calling and retrieving results
$.ajax({
    'url' : ajaxParams.action,
    'data' : ajaxParams.parameters,
    'dataType' : 'jsonp',
    'cache': true
    }).done(function(data){
        // reset markers array and remove DOM element
        $.each(data.businesses, function(index, value){
            result.push({
                'phone': data.businesses[index].display_phone,
                'image': data.businesses[index].image_url,
                'business': data.businesses[index].name,
                'yelp': data.businesses[index].url,
                'street': data.businesses[index].location.display_address[0],
                'city': data.businesses[index].location.display_address[1],
                'latitude': data.businesses[index].location.coordinate.latitude,
                'longitude': data.businesses[index].location.coordinate.longitude,
                'id': index,
                'visible': ko.observable(true)
            });
        });
    markers(result);
    pinMarkers(markers());
    }).fail(function(jqXHR, textStatus, errorThrown) {
        $("body").append("Failed to retrieve results.");
    });

//knockout to filter restaurant location
var viewModel = function() {
    this.locSearch = ko.observable('');

    // Criteria: retrieve value from text input field and filters markers and list items that match input
    // click button to start filtering criteria
    this.filter = function(){
         // click event to convert address to coordinates used for Google maps and Yelp API
        this.markers = ko.computed(function(){
            var self =this;
            var search = self.locSearch().toLowerCase();
            // Using Knockout utility to filter the restaurant location based on text input
            //Helpful documentation: http://www.knockmeout.net/2011/04/utility-functions-in-knockoutjs.html
            return ko.utils.arrayFilter(markers(), function(marker) {
                if (marker.business.toLowerCase().indexOf(search) >= 0) {
                    return marker.visible(true);
                } else {
                    return marker.visible(false);
                }
            });
        },this);
    }

    //Criteria: when Location on the list is clicked, animate icon by swapping marker icon
    // Closure to bind click event for each restaurant in the list
    // When a restaurant is clicked on the list, the infowindow will pop up
    // when restaurant location is clicked, it will display information the infowindow in the map
    this.restaurantClick = function(){
        infowindow.setContent(this.contentString);
        infowindow.open(map, this.restaurantPin);
        for(var x = 0; x < markers().length; x++){
            if(markers()[x].business == this.business){
                this.restaurantPin.setIcon("img/marker2.png");
                this.restaurantPin.setAnimation(google.maps.Animation.BOUNCE);
                this.restaurantPin.setVisible(true);
            }else{
                markers()[x].restaurantPin.setIcon("img/marker.png");
                markers()[x].restaurantPin.setAnimation(null);
                markers()[x].restaurantPin.setVisible(false);
            }
        }
    }

    //Reset the list and filter
    this.reset = function(){
        this.locSearch('');
        for(var x = 0; x < markers().length; x++){
            markers()[x].restaurantPin.setVisible(true);
            markers()[x].restaurantPin.setIcon("img/marker.png");
            markers()[x].restaurantPin.setAnimation(null);
        }
    }
};

ko.applyBindings(new viewModel());