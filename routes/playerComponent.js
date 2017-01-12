App.controller('playerController',  function($scope, $http, $window, $mdToast, ngDialog, authSvc, properties) {
var self = this;
authSvc.setView("no_chat");
var authSvc = authSvc;
self.mode = [];
self.showDetails = true;
self.showSection=[true, true, true, true, true, true, true];
self.showTechnical = true;
self.showTactical = true;
self.showSocial = true;
self.showPhysical = true;
self.showPsycological = true;
self.hidePicUpload = true;
self.imageSrc;

var id = authSvc.getCurrentPlayer();
  // if the id is zero, then we need to add a new player.
  if(id > 0) {
    $http.get("getPlayer?id=" +id +"&club=" +properties.alphaClub +"&team=" +properties.alphaTeam).then(function (response) {
      self.player =   response.data;
      self.imageSrc = "images/people/" +self.player.IDNumber;
    });
  } else {
    $http.get("/data/player.json").then(function (response) {
      self.player = response.data;
    });
  }


  self.updatePhoto = function(dataUrl, picfile){
    console.log("UPDATIG");
    var imageData = dataURItoBlob(dataUrl);
    var fd = new FormData();
    fd.append('userid', self.player.IDNumber);
    fd.append('avatar', imageData);

    $http({url: '/uploadPhoto',
          method: 'POST',
          data: fd,
          transformRequest: angular.identity,
          headers: {'Content-Type': undefined}
    }).success(function(){
        console.log("Success");
        self.imageSrc = "images/people/" +self.player.IDNumber +"?" +Date.now();
    }).error(function(){
        console.log("ERROR");
    });
  }

  $scope.rateFunction = function( rating ) {
     var data = {
       rating: rating
     };
  };

  $scope.getLimits = function (stuff) {
  return [
      Math.floor(stuff.length / 2) + 1,
      -Math.floor(stuff.length / 2)
  ];
};

self.editCell = function(index) {
  self.mode.length=0;
  self.mode[index] = "edit";
};


//This needs to be set to ensure that the request is prperly formed.
var config = {headers : {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'}}
self.updatePlayer = function() {
    $http.defaults.headers.post["Content-Type"] = "application/json";
    var data = JSON.stringify(self.player);
    $http.post("/updatePlayer?club=" +properties.alphaClub +"&team=" +properties.alphaTeam, self.player).success(function (data, status, headers, config) {
              this.player = data;
              self.mode.length=0;
              $mdToast.show($mdToast.simple().textContent("Player successfully updated").position("top left").hideDelay(1500));
            })
            .error(function (data, status, header, config) {
              $mdToast.show($mdToast.simple().textContent("Error in updating player! Status: " +status).position("top left").hideDelay(1500));
            });
};


self.addPlayer = function() {
    $http.defaults.headers.post["Content-Type"] = "application/json";
    self.player.IDNumber = Number(self.player.IDNumber);
    var data = JSON.stringify(self.player);

    $http.post("/addPlayer?club=" +properties.alphaClub +"&team=" +properties.alphaTeam, self.player).success(function (data, status, headers, config) {
              this.player = data;
              self.mode.length=0;
              $mdToast.show($mdToast.simple().textContent("Player successfully added!").position("top left").hideDelay(1500));
            })
            .error(function (data, status, header, config) {
              $mdToast.show($mdToast.simple().textContent("Error in adding player! Status: " +status).position("top left").hideDelay(1500));

            });
};

//Hack to receive a star clicked event... update player
$scope.$on('statClicked', function(event, args) {self.updatePlayer();});

});
