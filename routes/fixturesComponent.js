

App.controller('fixtureController', function ($scope, $http, ngDialog, textAngularManager, authService, authSvc, properties, $mdDialog) {

  var self = this;
  var showme = [];
  var month = "NONE";
  self.authSvc = authSvc;
  self.showmonth;
  self.games;
  self.showReport = {};
  self.fixID = {};
  self.properties = properties;

  // Get all of the games ready to display
  var config = {headers : {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'}}
  $http.get("/getFixtures?club=" +properties.alphaClub +"&team=" +properties.alphaTeam).then(function (response) {
      self.games = response.data;
      self.properties.fixtures = response.data;
    });

    // set the default value of our number
    $scope.myNumber = 0;

    /**
    * function to evaluate if a number is even
    */
    $scope.isEven = function(value) {
      if (value % 2 == 0)
        return true;
      else
        return false;
    };

    /**
    * function to return true if newmonth is different from month
    */
    self.showMonth = function(newmonth) {
      if(newmonth != month) {
        month = newmonth;
        return  true;
      } else {
        return  false;
      }
    };

    /**
    * hmmm?
    */
    self.reset = function() {
    console.log(count++);
    };

    /**
    * is authenticated?
    */
    self.isAuthenticated = function() {
      return authService.isAuthenticated();
    };

    /**
    * Convert a string to a date object
    */
    self.convertToDate = function (stringDate){
      var dateOut = new Date(stringDate);
      dateOut.setDate(dateOut.getDate() + 1);
      return dateOut;
    };

    /**
    * Update an existing fixture
    */
    self.updateFixture = function(fixture) {
      delete fixture["_id"];
      //console.log(fixture.DATETIME);
      var data= JSON.stringify(fixture);
      //fixture.DATETIME = new Date("2020-09-10T10:30:00.000Z");
      $http.defaults.headers.post["Content-Type"] = "application/json";
      $http.post("/updateFixture?club=" +properties.alphaClub +"&team=" +properties.alphaTeam, fixture).success(function (fixture, status, headers, config) {

          })
          .error(function (data, status, header, config) {
            alert(status);
          });
    };

    /**
    * Add a newly created fixture.
    */
    self.insertFixture = function(fixture) {

      $http.defaults.headers.post["Content-Type"] = "application/json";
      $http.post("/addFixture?club=" +properties.alphaClub +"&team=" +properties.alphaTeam, fixture).success(function (fixture, status, headers, config) {
            self.games.push(fixture);
          })
          .error(function (data, status, header, config) {
            alert(status);
          });
    }

    /**
    * Add a new fixture.
    */
    self.addFixture = function($event) {
      //get the template JSON
      $http.get("/data/availability.json").then(function (response) {
          var gameTemplate = response.data;
          gameTemplate.FIXTUREDATE = new Date().toISOString();
          self.showDialog($event, gameTemplate);
        });
    }

    /**
    * remove a fixture.
    */
    self.removeFixture = function(id) {
      //get the template JSON
      $http.defaults.headers.post["Content-Type"] = "application/json";
      $http.get("/removeFixture?club=" +properties.alphaClub +"&team=" +properties.alphaTeam +"&id=" +id).success(function (response) {
        //now remove the game from the model
        for(gamedel=0; gamedel < self.games.length;gamedel++) {
          console.log(self.games[gamedel].id);
            if(self.games[gamedel].id == id) {
              self.games.splice(gamedel,1);
            }
        }
      }).error(function (data, status, header, config) {
        console.log("error = " +self.games.length);
        alert(status);
      });
      console.log("boo");
    }

    /**
    * Open the fixture dialog
    */
    self.showDialog = function($event, game) {
      //get the players for the player selection
      $http.defaults.headers.post["Content-Type"] = "application/json";
      $http.get("/getPlayers?club=" +properties.alphaClub +"&team=" +properties.alphaTeam).then(function (response) {
        players = response.data;
        var parentEl = angular.element(document.body);

        //open the dialog box
        $mdDialog.show({
          parent: parentEl,
          targetEvent: $event,
          templateUrl: 'fixtureEdit.html',
          locals: {
            game: game,
            players: players
          },
         clickOutsideToClose:true,
         fullscreen:false,
         controller: DialogController
        });


        /**
        * The actual controller for the fiscture edit dialog box
        */
        function DialogController($scope, $mdDialog, game, players, properties) {
          $scope.game = game;
          $scope.players = players;
          //change fisxdate to a date object so that the date picker wil work... then update the actual object on change in the datepicker
          if(game != undefined) {
            $scope.dt = new Date(game.FIXTUREDATE)
          }

          $scope.closeDialog = function(game) {

            //Take the time and update the FIXTUREDATE
            if(game.KICKOFF != undefined) {
              //console.log(game);
              time = game.KICKOFF.split(".");
              var d = new Date(game.FIXTUREDATE);
              d.setHours(time[0]);
              d.setMinutes(time[1]);
              game.FIXTUREDATE = d.toISOString();
              var monthNames = ["January", "February", "March", "April", "May", "June","July", "August", "September", "October", "November", "December"];
              game.MONTH = monthNames[d.getMonth()];
              //console.log(game.FIXTUREDATE);
            }

            // If an ID already exists then updfate the existing record, otherwise add a brand new fixture.
            if(game._id != undefined) {
              delete game["_id"];
              var data = JSON.stringify(game);

              delete game["NewScorer"];
              $http.defaults.headers.post["Content-Type"] = "application/json";
              $http.post("/updateFixture?club=" +properties.alphaClub +"&team=" +properties.alphaTeam, game).success(function (game, status, headers, config) {
                    $mdDialog.hide();
              })
              .error(function (data, status, header, config) {
                alert(status);
              })
            } else {
              delete game["NewScorer"];
              $http.defaults.headers.post["Content-Type"] = "application/json";
              $http.post("/addFixture?club=" +properties.alphaClub +"&team=" +properties.alphaTeam, game).success(function (game, status, headers, config) {
                  $mdDialog.hide();
                })
                .error(function (data, status, header, config) {
                  alert(status);
                });
            }
        }

        /**
        * add a player as a goalscorer
        */
        $scope.addGoalScorer = function (scorers, scorer, goals) {
            s = JSON.parse(scorer);
            scorers.push({Player:s.Player, Goals:goals, IDNumber:s.IDNumber});
        };

        /**
        * remove a goalscorer form a game
        */
        $scope.removeGoalScorer = function (scorers, index) {
            console.log(scorers.length);
            scorers.splice(index,1);
        };

      }
    })
  }




  /*  function DialogController($scope, $mdDialog) {
      $scope.hide = function() {
        $mdDialog.hide();
      };

      $scope.cancel = function() {
        $mdDialog.cancel();
      };

      $scope.answer = function(answer) {
        $mdDialog.hide(answer);
      };
  }*/

  /*  self.openFixtureEdit = function (x) {
      console.log("edit fixture");
        ngDialog.open({ template: '../fixtureEdit.html', className: 'ngdialog-theme-default', data: x , showClose: false});
    }; */


    self.showreport = function (id) {
      //console.log("ID=" +this.showReport[id]);
        //if(this.showReport[id] === null || this.showReport[id] === undefined) {
          self.showReport[id] = true;
        //} else {
        //  this.showReport[id] = !this.showReport[id]
        //}
    };


});
