angular.module('watchly.MapCtrl', ['watchly.Auth', 'watchly.Incidents', 'watchly.Messages'])

.controller('MapCtrl', function ($scope, $http, $ionicModal, $ionicLoading, $ionicSideMenuDelegate, $compile, $filter, Auth, Incidents, Messages) {

  function initialize() {
    $scope.geoCoder = new google.maps.Geocoder();
    var mapOptions = {
      // Center on Hack Reactor
      center: new google.maps.LatLng(37.783726, -122.408973),
      zoom: 18,
      // mapTypeId: google.maps.MapTypeId.ROADMAP
      disableDoubleClickZoom: true,
      // Pegman Street View
      streetViewControl: false,
      // Zoom Control Bar
      zoomControl: true,
      zoomControlOptions: {
        // .SMALL, .LARGE, .DEFAULT
        style: google.maps.ZoomControlStyle.DEFAULT,
        // .LEFT_BOTTOM, .RIGHT_CENTER etc.
        position: google.maps.ControlPosition.TOP_RIGHT
      },
      // Cardinal Direction Controller
      panControl: false,
      // Map/Satellite View Switch
      mapTypeControl: false,
      mapTypeControlOptions: {
        // .HORIZONTAL_BAR, .DROPDOWN_MENU, .DEFAULT
        style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
      },
      // Display scale control at bottom of map
      scaleControl: false,
      // Display map overview nav at bottom of map
      overviewMapControl: false,
      // Map stylers
      styles: [{
        featureType: "poi.business",
        elementType: "labels",
        stylers: [{
          visibility: "off"
        }]
      }, {
        "featureType": "landscape.natural",
        "elementType": "geometry.fill",
        "stylers": [{
          "visibility": "on"
        }, {
          "color": "#e0efef"
        }]
      }, {
        "featureType": "poi",
        "elementType": "geometry.fill",
        "stylers": [{
          "visibility": "on"
        }, {
          "hue": "#1900ff"
        }, {
          "color": "#c0e8e8"
        }]
      }, {
        "featureType": "road",
        "elementType": "geometry",
        "stylers": [{
          "lightness": 100
        }, {
          "visibility": "simplified"
        }]
      }, {
        "featureType": "road",
        "elementType": "labels",
        "stylers": [{
          "visibility": "on"
        }]
      }, {
        "featureType": "transit.line",
        "elementType": "geometry",
        "stylers": [{
          "visibility": "on"
        }, {
          "lightness": 700
        }]
      }, {
        "featureType": "water",
        "elementType": "all",
        "stylers": [{
          "color": "#7dcdcd"
        }]
      }]
    };

    var map = new google.maps.Map(document.getElementById("map"),
      mapOptions);

    $scope.map = map;
    $scope.populateIncidentTypes();
    $scope.getIncidents();
    $scope.setDateAndTime();

    google.maps.event.addListener(map, 'mousedown', function (event) {
      clearTimeout($scope.downTimer);
      $scope.downTimer = setTimeout(function () {
        $scope.placeMarker(event.latLng);
      }, 1000);
    });

    google.maps.event.addListener(map, 'mouseup', function (event) {
      clearTimeout($scope.downTimer);
    });

    google.maps.event.addListener(map, 'drag', function (event) {
      clearTimeout($scope.downTimer);
    });


  }

  google.maps.event.addDomListener(window, 'load', initialize);

  $scope.incidentTypes = [];
  $scope.incidentTypeNames = {};
  $scope.incidents = {};
  $scope.renderedIncidents = {};
  $scope.mapBounds = {};

  $scope.setMapBounds = function () {
    var bounds = $scope.map.getBounds();
    var northEastBound = bounds.getNorthEast();
    var southWestBound = bounds.getSouthWest();
    $scope.mapBounds.minLat = southWestBound.A;
    $scope.mapBounds.maxLat = northEastBound.A;
    $scope.mapBounds.minLon = southWestBound.F;
    $scope.mapBounds.maxLon = northEastBound.F;
  };

  $scope.getIncidents = function () {
    
    Incidents.getAllIncidents().then(function (result) {
      result[0].forEach(function (incident) {
        $scope.incidents[incident.id] = incident;
      })
      $scope.renderAllIncidents();
    });
  };

  $scope.renderAllIncidents = function () {
    // what does keys look like?
    var keys = Object.keys($scope.incidents);
    for (var i = 0; i < keys.length; i++) {
      if ($scope.renderedIncidents[keys[i]] === undefined) {
        $scope.renderIncident($scope.incidents[keys[i]]);
        $scope.renderedIncidents[keys[i]] = true;
      }
    }
  };

  // template for the info window content.split(",")[0]
  $scope.infoHtml = 
      ' <div class="info-popup"> \
        <span><strong><%= username %></strong> has spotted a <strong><%= type %></strong> at <strong><%= shortAddress %></strong></span> \
        <p><strong id="percentage"><%= percentageOfUpvotes %></strong>% of voters think this pet is cute. What do you think?</p> \
        <div> \
          <img class="pet" src="<%= imageURL %>"/> \
          <div class="sidebar"> \
            <img class="arrow" id="up-arrow" src="img/arrow_up.png"> <br> \
            <center id="popularity"><%= popularity %></center> \
            <img class="arrow" id="down-arrow" src="img/arrow_down.png"> \
          </div> \
          <div class="description"> \
            <p><i>"<%= description %>"</i> </p> \
          </div> \
        </div> \
      </div> ';

  $scope.testObj = {
    username: 'justin',
    type: 'cat',
    fuzzyAddress: 'Mason & Market, San Francisco, CA 96102',
    url: 'http://colourfulrebel.com/en/wp-content/uploads/2015/06/Cute-Kittens-1-Wallpaper-HD.jpg',
    popularity: 45,
    votes: 100,
    description: 'like omg this cat is super cute'
  };

  $scope.template = _.template($scope.infoHtml);
  $scope.infoWindows = [];
  $scope.cache = {};

  $scope.renderIncident = function (incidentObj) {
    var incidentPos = new google.maps.LatLng(incidentObj.latitude, incidentObj.longitude);
    var incidentIcon = "./img/" + incidentObj.iconFilename;
    var incident = new google.maps.Marker({
      position: incidentPos,
      map: $scope.map,
      icon: incidentIcon
    });
    incidentObj.shortAddress = incidentObj.fuzzyAddress.split(",")[0];
    incidentObj.percentageOfUpvotes = parseInt(((incidentObj.votes + incidentObj.popularity) / (2 * incidentObj.votes)) * 100);
    // var incidentInfoWindowContent ='<div id="popup" class="info-popup"><div><strong>' + incidentObj.username +' </strong> has spotted a <strong>' + 
    // incidentObj.type + '!</strong> at <strong>' + incidentObj.fuzzyAddress.split(",")[0] + 
    // '</strong></div> <img src="http://colourfulrebel.com/en/wp-content/uploads/2015/06/Cute-Kittens-1-Wallpaper-HD.jpg" height="200px"/></div>'

    var incidentInfoWindow;
    var incidentInfoWindowContent = $scope.template(incidentObj);
    var hasVoted = false;

    google.maps.event.addListener(incident, 'click', function () {
      $scope.infoWindows.forEach(function (window) {
        window.close();
      });
      incidentInfoWindow = new google.maps.InfoWindow({
        content: incidentInfoWindowContent
      });
      google.maps.event.addListener(incidentInfoWindow, 'domready', function () {
        var pop = document.getElementById('popularity');
        var numVotes = document.getElementById('votes');
        // if there's something in the cache, a vote has already happened
        // TODO: set proper % from cache
        if ($scope.cache[incidentObj.id]) {
          hasVoted = true;
          cachedPop = $scope.cache[incidentObj.id].popularity;
          cachedVotes = $scope.cache[incidentObj.id].votes;
          cachedArrow = $scope.cache[incidentObj.id].hiddenArrow;

          document.getElementById(cachedArrow).style.visibility = 'hidden';
          pop.innerHTML = cachedPop;
          document.getElementById('percentage').innerHTML = parseInt(((cachedVotes + cachedPop) / (2 * cachedVotes)) * 100);
        }

        if (!hasVoted) {
          google.maps.event.addDomListenerOnce(document.getElementById('up-arrow'), 'click', function () {
            $scope.upvote(incidentObj, pop, numVotes);
          });
          google.maps.event.addDomListenerOnce(document.getElementById('down-arrow'), 'click', function () {
            $scope.downvote(incidentObj, pop, numVotes);
          });
        } 
      });
      $scope.infoWindows.push(incidentInfoWindow);
      incidentInfoWindow.open($scope.map, incident);
    });
  };

  $scope.upvote = function (petObj, pop, numVotes) {
    // update petObj and pass new values to DB through incidents factory
    petObj.popularity++;
    petObj.votes++;
    Incidents.updatePopularity(petObj);
    // render new pop immediately on the screen
    pop.innerHTML++;
    // hide downvote arrow
    document.getElementById('down-arrow').style.visibility = 'hidden';
    // cache the updated values
    $scope.cache[petObj.id] = {
      popularity: petObj.popularity,
      votes: petObj.votes,
      hiddenArrow: 'down-arrow'
    }

  }
  $scope.downvote = function(petObj, pop, numVotes) {
    // update petObj and pass new values to DB through incidents factory
    petObj.popularity--;
    petObj.votes++;
    Incidents.updatePopularity(petObj);
    // render new pop immediately on the screen
    pop.innerHTML--;
    // hide upvote arrow
    document.getElementById('up-arrow').style.visibility = 'hidden';
    // cache the updated values
    $scope.cache[petObj.id] = {
      popularity: petObj.popularity,
      votes: petObj.votes,
      hiddenArrow: 'up-arrow'
    }
  }





  $scope.populateIncidentTypes = function () {
    Incidents.getIncidentTypes().then(function (result) {
      $scope.incidentTypes = result;
      result.forEach(function (incidentType) {
        $scope.incidentTypeNames[incidentType.type] = incidentType.id;
      });
    });
  };

  $scope.setDateAndTime = function () {
    var incidentDate = document.getElementsByClassName('incidentDate')[0];
    var incidentTime = document.getElementsByClassName('incidentTime')[0];
    incidentDate.value = $filter("date")(Date.now(), 'yyyy-MM-dd');
    incidentTime.value = $filter("date")(Date.now(), 'HH:mm');
  };

  // TODO Change this to current time rather than being hard coded
  // var today = new Date();
  $scope.newIncident = {};
  $scope.newIncident.curDate = "";
  $scope.newIncident.curTime = "";
  $scope.newIncidentType;

  $scope.incidentReportForm = {
    hidden: true
  };

  $scope.createIncidentButton = {
    hidden: true
  };

  $scope.cancelIncidentButton = {
    hidden: true
  };

  $scope.downTimer;
  $scope.newIncidentMarker;

  $scope.placeMarker = function (location) {

    if (!$scope.newIncidentMarker) {
      $scope.newIncidentMarker = new google.maps.Marker({
        animation: google.maps.Animation.DROP,
        position: location,
        map: $scope.map,
        icon: {
          url: "./img/other.png",
          size: new google.maps.Size(25, 25)
        }
      });
      $scope.revealConfirmCancel();
      $scope.userIncident.location = location;
      $scope.userIncident.longitude = location.lng();
      $scope.userIncident.latitude = location.lat();
    }
    if ($scope.newIncidentMarker) {
      $scope.newIncidentMarker.setMap(null);
      $scope.newIncidentMarker = false;
      $scope.newIncidentMarker = new google.maps.Marker({
        animation: google.maps.Animation.DROP,
        position: location,
        map: $scope.map,
        icon: {
          url: "./img/other.png",
          size: new google.maps.Size(25, 25)
        }
      });
      $scope.revealConfirmCancel();
      $scope.userIncident.location = location;
      $scope.userIncident.longitude = location.lng();
      $scope.userIncident.latitude = location.lat();
    }

  };

  $scope.confirmIncidentCreate = function () {
    if (Auth.isAuthenticated()) {
      $scope.incidentReportForm.hidden = false;
    } else {
      $scope.openSignInModal();
    }
  };

  $scope.revealConfirmCancel = function () {
    $scope.createIncidentButton.hidden = false;
    $scope.cancelIncidentButton.hidden = false;
    $scope.$apply();
  };

  $scope.hideConfirmCancel = function () {
    $scope.createIncidentButton.hidden = true;
    $scope.cancelIncidentButton.hidden = true;
    $scope.incidentReportForm.hidden = true;
  };

  $scope.removeIncident = function () {
    $scope.newIncidentMarker.setMap(null);
    $scope.newIncidentMarker = false;
    $scope.hideConfirmCancel();
  };

  $scope.userIncident = {
    location: "",
    latitude: "",
    longitude: "",
    fuzzyAddress: ""
  };

  $scope.submitIncident = function (incident) {
    $scope.loading = $ionicLoading.show({
      content: 'Uploading a new adorable pet ...',
      showBackdrop: false
    });
    var dbIncident = {};
    // $scope.removeIncident();
    dbIncident.description = incident.description;
    // Set incidentTypeId to bind icon for rendering
    dbIncident.incidentTypeId = $scope.incidentTypeNames[incident.type];
    // Set the imageURL to the input imageURL;
    dbIncident.imageURL = incident.imageURL;
    // Set initial popularity and votes to 0
    dbIncident.popularity = 0;
    dbIncident.votes = 0;

    if (incident.curDate === "") {
      incident.curDate = new Date();
    }
    if (incident.curTime === "") {
      incident.curTime = new Date();
    }
    dbIncident.occurred_at = incident.curDate.toISOString().slice(0, 10) + " " + incident.curTime.toTimeString().slice(0, 8);
    dbIncident.latitude = $scope.userIncident.latitude;
    dbIncident.longitude = $scope.userIncident.longitude;
    dbIncident.description = incident.description;
    $scope.reverseGeo($scope.userIncident.location, function () {
      // TODO Figure out if we can reverseGeo the real address...placeholder for now.
      dbIncident.address = $scope.userIncident.fuzzyAddress;
      dbIncident.fuzzyAddress = $scope.userIncident.fuzzyAddress;
      Incidents.createNewIncident(dbIncident).then(function () {
        $scope.removeIncident();
        $scope.getIncidents();
        $scope.renderAllIncidents();
        $scope.loading.hide();
      });
    });
  };

  $scope.reverseGeo = function (location, next) {
    $scope.geoCoder.geocode({
      'latLng': location
    }, function (result, status) {
      if (status === google.maps.GeocoderStatus.OK) {
        $scope.userIncident.address = result[0].formatted_address;
        $scope.userIncident.fuzzyAddress = result[1].formatted_address;
        next();
      } else {
        console.log("Error Retrieving Address");
      }
    });
  };

  $scope.centerMapOnUser = function () {
    if (!$scope.map) {
      return;
    }

    $scope.loading = $ionicLoading.show({
      content: 'Getting current location...',
      showBackdrop: false
    });

    navigator.geolocation.getCurrentPosition(function (pos) {
      $scope.map.setCenter(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
      $scope.loading.hide();
    }, function (error) {
      alert('Unable to get location: ' + error.message);
    });
  };


  $ionicModal.fromTemplateUrl('templates/signin.html', {
    scope: $scope,
    animation: 'slide-in-up',
    focusFirstInput: true,
  }).then(function (modal) {
    $scope.signInModal = modal;
  });


  $ionicModal.fromTemplateUrl('templates/signup.html', {
    scope: $scope,
    animation: 'slide-in-up',
    focusFirstInput: true,
  }).then(function (modal) {
    $scope.signUpModal = modal;
  });

  $ionicModal.fromTemplateUrl('templates/forgotpassword.html', {
    scope: $scope,
    animation: 'slide-in-up',
    focusFirstInput: true,
  }).then(function (modal) {
    $scope.forgotPasswordModal = modal;
  });

  $ionicModal.fromTemplateUrl('templates/profile.html', {
    scope: $scope,
    animation: 'slide-in-up',
  }).then(function (modal) {
    $scope.profileModal = modal;
  });

  $scope.profileActivate = function () {
    if (Auth.isAuthenticated()) {
      $scope.user = Auth.getUser();
      $scope.profileModal.show();
    } else {
      $scope.signInModal.show();
    }
  };

  $scope.openSignInModal = function () {
    $scope.signInModal.show();
  };

  $scope.closeSignInModal = function () {
    $scope.signInModal.hide();
  };

  $scope.openSignUpModal = function () {
    $scope.signUpModal.show();
  };

  $scope.closeSignUpModal = function () {
    $scope.signUpModal.hide();
  };

  $scope.openForgotPasswordModal = function () {
    $scope.forgotPasswordModal.show();
  };

  $scope.closeForgotPasswordModal = function () {
    $scope.forgotPasswordModal.hide();
  };

  $scope.closeProfileModal = function () {
    $scope.profileModal.hide();
  };

  $scope.signUp = function (user) {
    Auth.signup(user).then(function (res) {
      $scope.closeSignUpModal();
    });
  };

  $scope.signIn = function (user) {
    Auth.signin(user).then(function (res) {
      $scope.closeSignInModal();
    });
  };

  $scope.signOut = function () {
    Auth.signout().then(function (res) {
      $scope.closeProfileModal();
    });
  };

  $scope.forgotPassword = function (email) {
    Auth.forgotpassword(email).then(function (res) {
      $scope.closeForgotPasswordModal();
    });
  };

  $scope.isValidPhoneNumber = function (number) {
    return number ? number.match(/^[(]{0,1}[0-9]{3}[)]{0,1}[-\s\.]{0,1}[0-9]{3}[-\s\.]{0,1}[0-9]{4}$/) : false;
  };

  $scope.isValidEmail = function (email) {
    return email ? email.match(/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/) : false;
  };
});
