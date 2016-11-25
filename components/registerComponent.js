

function registerController($scope,$http) {
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
      console.log("REGISTER " +JSON.stringify(club));
      $http.defaults.headers.post["Content-Type"] = "application/json";
      var data = JSON.stringify(club);
      $http.post("/addClub", data).success(function (data, status, headers, config) {

        }).error(function (data, status, header, config) {
              alert(status);
        });
    };

    ctrl.registerTeam = function (team) {
      console.log("REGISTER " +JSON.stringify(team));
      $http.defaults.headers.post["Content-Type"] = "application/json";
      var data = JSON.stringify(team);
      $http.post("/addTeam", data).success(function (data, status, headers, config) {
        }).error(function (data, status, header, config) {
              alert(status);
        });
    };

}


angular.module('myApp').component('register', {
  templateUrl: 'components/registerComponent.html',
  controller: registerController
});
