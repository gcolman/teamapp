

App.controller('playersController', function ($scope, $http, ngDialog, authSvc, properties,$mdDialog) {

  var self = this;

  self.playerID = {};
  self.player;
  self.showDetails={};

  $http.defaults.headers.post["Content-Type"] = "application/json";
  $http.get("/getPlayersWithStats?club=" +properties.alphaClub +"&team=" +properties.alphaTeam).then(function (response) {
      self.names = response.data;
      properties.players = response.data;
    });

    self.addPlayer = function (players) {
      $http.get("../data/player.json").then(function (response) {
          self.player = response.data;
          players.push(self.player);
          ngDialog.open({ template: '../newPlayer.html', className: 'ngdialog-theme-default', data: self.player , showClose: false});
        });
    };

    //This needs to be set to ensure that the request is prperly formed.
    var config = {headers : {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'}}
    self.addPlayerDB = function(player) {
        var data = JSON.stringify(data);
        console.log(player);
        $http.post("/addPlayer?club=" +properties.alphaClub +"&team=" +properties.alphaTeam, player).success(function (data, status, headers, config) {
                  ngDialog.close();
                })
                .error(function (data, status, header, config) {
                  alert(status);
                });
    };

    self.setPlayer = function (player) {
        authSvc.setCurrentPlayer(player);
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
      $http.post("/updateFixture?club=" +properties.alphaClub +"&team=" +properties.alphaTeam, fixture).success(function (fixture, status, headers, config) {
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
        $http.post("/addPlayer?club=" +properties.alphaClub +"&team=" +properties.alphaTeam, self.player).success(function (data, status, headers, config) {
                  this.player = data;
                  ngDialog.close();
                })
                .error(function (data, status, header, config) {
                  alert(status);
                });
    };


    /**
    *  Delete player
    */
    self.deletePlayer = function(ev, player) {
       var confirm = $mdDialog.confirm()
             .title('Delete Player')
             .textContent('Are you sure you wanted to delete this player?')
             .ariaLabel('delete')
             .targetEvent(ev)
             .ok('Yes')
             .cancel('No');
       $mdDialog.show(confirm).then(function() {
         $http.get("removePlayer?id=" +player +"&club=" +properties.alphaClub +"&team=" +properties.alphaTeam).then(function (response) {
           //now remove the player from the model
           for(playerdel=0; playerdel < self.names.length;playerdel++) {
               if(self.names[playerdel].IDNumber == player) {
                 self.names.splice(playerdel,1);
               }
           }
             self.player = response.data;
           });
       }, function() {
       });
     };

});
