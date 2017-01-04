App.controller('registerController', function ($scope, $http, ngDialog, authSvc, properties) {
  authSvc.setView("no_chat");
  var ctrl = this;
  var config = {headers : {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'}}
  $http.get("/getCollection?collection=clubs").then(function (response) {
      ctrl.clubs = response.data;
    });

  $http.get("/getCollection?collection=teams").then(function (response) {
      ctrl.teams = response.data;
    });

    $http.get("data/team.json").then(function (response) {
        ctrl.team = response.data;
      });

    $http.get("data/club.json").then(function (response) {
        ctrl.club = response.data;
      });

    ctrl.registerClub = function (club) {
      //console.log("REGISTER " +JSON.stringify(club));
      $http.defaults.headers.post["Content-Type"] = "application/json";
      //console.log("USER = " +properties.userid);
      var data = JSON.stringify(club);
      $http.post("/addClub?userid=" +properties.userid, data).success(function (data, status, headers, config) {

        }).error(function (data, status, header, config) {
              alert(status);
        });
    };

    ctrl.registerTeam = function (team) {
      //console.log("REGISTER " +JSON.stringify(team));
      $http.defaults.headers.post["Content-Type"] = "application/json";
      var data = JSON.stringify(team);
      $http.post("/addTeam?userid=" +properties.userid, data).success(function (data, status, headers, config) {
        }).error(function (data, status, header, config) {
              alert(status);
        });
    };
  });
