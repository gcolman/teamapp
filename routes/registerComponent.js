App.controller('registerController', function ($scope, $http, $location, ngDialog, authSvc, properties) {
  authSvc.setView("no_chat");
  var ctrl = this;
  var config = {headers : {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'}}

  //Get all of the clubs
  $http.get("/getCollection?collection=clubs").then(function (response) {
      ctrl.clubs = response.data;
    });

  // Get all of the teams
  $http.get("/getCollection?collection=teams").then(function (response) {
      ctrl.teams = response.data;
    });

  // Get the team json
  $http.get("data/team.json").then(function (response) {
      ctrl.team = response.data;
    });

  //get the club JSON
  $http.get("data/club.json").then(function (response) {
      ctrl.club = response.data;
    });

  /**
  * Register a club
  **/
  ctrl.registerClub = function (club, img) {

    if(img == undefined) {
      club.badgeUploaded=false;
    } else {
      club.badgeUploaded=true;
    }

    $http.defaults.headers.post["Content-Type"] = "application/json";
    //console.log("USER = " +properties.userid);
    var data = JSON.stringify(club);
    $http.post("/addClub?userid=" +properties.userid, data).success(function (data, status, headers, config) {

      if(club.badgeUploaded) {
        var imageData = dataURItoBlob(img);
        var fd = new FormData();
        fd.append('userid', "ClubBadge" +data.clubId);
        fd.append('avatar', imageData);

        $http({url: '/uploadPhoto',
              method: 'POST',
              data: fd,
              transformRequest: angular.identity,
              headers: {'Content-Type': undefined}
        }).success(function(){
            console.log("Success");
        }).error(function(){
            console.log("ERROR");
        });
      }
        $location.path("/");

      }).error(function (data, status, header, config) {
            alert(status);
      });
  };


  /**
  * Register a club
  **/
  ctrl.registerTeam = function (team, img) {
    //console.log("REGISTER " +JSON.stringify(team));
    if(img == undefined) {
      team.badgeUploaded=false;
    } else {
      team.badgeUploaded=true;
    }

    $http.defaults.headers.post["Content-Type"] = "application/json";
    if(team.administrators == undefined){team.administrators = [];}
    team.administrators.push(properties.userid);
    var data = JSON.stringify(team);
    $http.post("/addTeam?userid=" +properties.userid, data).success(function (data, status, headers, config) {

      if(team.badgeUploaded) {
        var imageData = dataURItoBlob(img);
        var fd = new FormData();
        fd.append('userid', "TeamBadge" +data.teamId);
        fd.append('avatar', imageData);

        $http({url: '/uploadPhoto',
              method: 'POST',
              data: fd,
              transformRequest: angular.identity,
              headers: {'Content-Type': undefined}
        }).success(function(){
            console.log("Success");
        }).error(function(){
            console.log("ERROR");
        });
      }
        $location.path("/");
    }).error(function (data, status, header, config) {
          alert(status);
    });
  };
});
