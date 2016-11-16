

function playersController($scope, $http, ngDialog) {

  var self = this;
  self.playerID = {};
  self.player;
  self.showDetails={};

  $http.defaults.headers.post["Content-Type"] = "application/json";
  $http.get("/getPlayersWithStats").then(function (response) {
      self.names = response.data;
    });

    self.addPlayer = function (players) {
      $http.get("../data/player.json").then(function (response) {
          self.player = response.data;
          players.push(self.player);
          console.log(self.player);
          ngDialog.open({ template: '../newPlayer.html', className: 'ngdialog-theme-default', data: self.player , showClose: false});
        });
    };

    //This needs to be set to ensure that the request is prperly formed.
    var config = {headers : {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'}}
    self.addPlayerDB = function(player) {


        var data = JSON.stringify(data);
        console.log(player);
        $http.post("/addPlayer", player).success(function (data, status, headers, config) {
                  ngDialog.close();
                })
                .error(function (data, status, header, config) {
                  alert(status);
                });
    };

    self.addGoalScorer = function (scorers, scorer, goals) {
        s = JSON.parse(scorer);
        scorers.push({Player:s.Player, Goals:goals, IDNumber:s.IDNumber});
    };

    self.removeGoalScorer = function (scorers, index) {
        console.log(scorers.length);
        scorers.splice(index,1);
    };

    self.updateFixture = function(fixture) {
      delete fixture["_id"];
      var data= JSON.stringify(fixture);
      $http.defaults.headers.post["Content-Type"] = "application/json";
      $http.post("/updateFixture", fixture).success(function (fixture, status, headers, config) {
            ngDialog.close();
          })
          .error(function (data, status, header, config) {
            alert(status);
          });
    };

    //This needs to be set to ensure that the request is prperly formed.
    var config = {headers : {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'}}
    self.addPlayerDBxx = function() {
        console.log(self.player);
        $http.defaults.headers.post["Content-Type"] = "application/json";
        var data = JSON.stringify(self.player);
        $http.post("/addPlayer", self.player).success(function (data, status, headers, config) {
                  this.player = data;
                  ngDialog.close();
                })
                .error(function (data, status, header, config) {
                  alert(status);
                });
    };

    self.deletePlayer = function(player) {
        console.log("delete player " +player.Player);
        $http.get("removePlayer?id=" +player.IDNumber).then(function (response) {
            self.player = response.data;
          });
    };


}

angular.module('myApp').component('players', {
  templateUrl: 'components/playersComponent.html',
  controller: playersController
});
