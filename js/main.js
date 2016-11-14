var App = angular.module('myApp',['ngMaterial', 'ngMessages', 'ngMdIcons','ngDialog','ngCookies','textAngular', 'ngWebSocket','ngFileUpload', 'ngImgCrop']);
'use strict';
App.config( [ '$locationProvider', function( $locationProvider ) {
   $locationProvider.html5Mode( true );
}]);

App.config(function($mdThemingProvider) {
  $mdThemingProvider.theme('dark-grey').backgroundPalette('grey').dark();
  $mdThemingProvider.theme('dark-orange').backgroundPalette('orange').dark();
  $mdThemingProvider.theme('dark-purple').backgroundPalette('deep-purple').dark();
  $mdThemingProvider.theme('dark-blue').backgroundPalette('blue').dark();
  });


  /*****************************************************************
  * Chat Factory
  *****************************************************************/
  App.factory('chatService', function($websocket) {
     // Open a WebSocket connection
     var chatService = {};
     var dataStream = $websocket('ws://www.graeme.com:8001/msg');
     var collection = [];


     dataStream.onMessage(function(message) {
       console.log(">>>" +message.data);
       collection.push(message.data);
     });

     dataStream.onClose(function() {
       console.log(">>>RECONNECT WS");
       dataStream = $websocket('ws://www.graeme.com:8001/msg');
     });

     chatService.sendMsg = function(msg) {
      dataStream.send(msg);
    };

    chatService.getMsg = function() {
      return collection;
    };

     var methods = {
       collection: collection,
       get: function(msg) {
         dataStream.send(msg);
       }
     };

     return methods;
   });


   /*******************************
   * Auth Factory Service
   ********************************/
   App.factory('authSvc', function($cookies, hashService) {
    return {
      getUsername : function() {
        return $cookies.get("user");
      },
      getUserid : function() {
        return $cookies.get("id");
      },
      isAuthenticated : function() {
        if(($cookies.get("a199hhy78327772679hhy") != null) && ($cookies.get("a199hhy78327772679hhy") == hashService.hash($cookies.get("user")))) {
          return true;
        } else {
          return false;
        }
      }
    }
  });

  /*******************************
  * User Factory
  ********************************/
/*  App.factory('userSvc', function($http) {
   return {
     getUser : function(userid) {
       console.log("IN GET SINGLE USER");
       $http.get("/getUser?" +userid).then(function (response) {
           return response.data;
        })
     },
     getAllUsers : function() {
       console.log("IN GET USERS");
       $http.get("/getUsers").success(function (response){
         return response.data;
       }
     ).error(function (data, status, header, config) {
       alert(status);
     });
   }
  }
 });
*/

/*****************************************************************************************************
*                             SERVICES
*****************************************************************************************************/

/**
* Service to hash a username
* -- this should be seeded with something config based.
*/
App.service('hashService', function () {
    this.hash = function(orig,seed) {
        if(orig == null || orig =="") {
          return null;
        } else {
          hash = orig.split('').map(function (char) {return char.charCodeAt(0);}).reduce(function (current, previous) {return previous + current;});
          d = new Date();
          day = d.getYear() + d.getMonth() +d.getDate() +d.getHours();
          return hash*day;
        }
    };
});

/**
* Auth Service
*
*/
App.service('authService', function($rootScope, $http, $cookies, ngDialog, hashService) {

  this.login = function(credential) {
      delete credential["_id"];
      var data= JSON.stringify(credential);
      console.log(data);
      $http.defaults.headers.post["Content-Type"] = "application/json";
      $http.post("/login", data).success(function (data, status, headers, config) {
            if(data[0] != null) {
              console.log("SUCCESS" +JSON.stringify(data));
              $cookies.put("a199hhy78327772679hhy", hashService.hash(data[0].username, ""));
              $cookies.put("user", data[0].username);
              $cookies.put("role", data[0].role);
              $cookies.put("id", data[0].userid);
              $rootScope.$broadcast('auth', 'login');
            } else {
              console.log("FAIL");
              alert("invalid username or password");
            }
            ngDialog.close();
          })
          .error(function (data, status, header, config) {
            alert(status);
          });
  };

  this.isAuthenticated = function() {
    if(($cookies.get("a199hhy78327772679hhy") != null) && ($cookies.get("a199hhy78327772679hhy") == hashService.hash($cookies.get("user")))) {
      return true;
    } else {
      return false;
    }
  };

  this.getUsername = function() {
      return $cookies.get("user");
  };

  this.getUserID = function() {
      return $cookies.get("id");
  };
});



/*****************************************************************************************************
*                             CONTROLERS
*****************************************************************************************************/

/***********************
* WEB SOCKET CONTROLLER.
************************/
App.controller('wsCtl', function ($scope, chatService) {
  $scope.chatService = chatService;
});

/***********************
* AUTH CONTROLLER.
************************/
App.controller('authCtl', function($scope, $rootScope, $cookies, authService, ngDialog, hashService) {
  var self = this;

  self.dologin = function(credential) {
    ngDialog.open({ template: '../loginDialog.html', className: 'ngdialog-theme-default', data: credential , showClose: false});
  };

 self.login = function(credential) {
    authService.login(credential);
  };

  self.logout = function() {
    $cookies.remove("a199hhy78327772679hhy");
    $cookies.remove("user");
    $cookies.remove("role");
    $cookies.remove("id");
    $rootScope.$broadcast('auth', 'logout');
  };

  self.isAuthenticated = function() {
      return authService.isAuthenticated();
  };
    self.isAdmin = function() {
      if(($cookies.get("a199hhy78327772679hhy") == hashService.hash($cookies.get("user"))) && ($cookies.get("role") == "admin")) {
        console.log("admin");
        return true;
      } else {
        console.log("notadmin");
        return false;
      }

  };
});



/***********************
* GAMES CONTROLLER.
************************/
App.controller('gamesCtl', function($scope, $http, ngDialog, textAngularManager, authService) {
  var self = this;
  var showme = [];
  var month = "NONE";
  self.showmonth;
  self.showReport = {};
  self.fixID = {};


  var config = {headers : {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'}}
  $http.get("/getFixtures").then(function (response) {
      self.games = response.data;
    });

    // set the default value of our number
    $scope.myNumber = 0;

    // function to evaluate if a number is even
    $scope.isEven = function(value) {

    if (value % 2 == 0)
      return true;
    else
      return false;

    };


    self.showMonth = function(newmonth) {
      if(newmonth != month) {
        month = newmonth;
        return  true;
      } else {
        return  false;
      }
    };

    self.reset = function() {
    console.log(count++);
    };

    self.isAuthenticated = function() {
      return authService.isAuthenticated();
    };

    self.updateFixture = function(fixture) {
      delete fixture["_id"];
      //console.log(fixture.DATETIME);
      var data= JSON.stringify(fixture);
      //fixture.DATETIME = new Date("2020-09-10T10:30:00.000Z");
      $http.defaults.headers.post["Content-Type"] = "application/json";
      $http.post("/updateFixture", fixture).success(function (fixture, status, headers, config) {

          })
          .error(function (data, status, header, config) {
            alert(status);
          });
    };

    self.openFixtureEdit = function (x) {
      console.log("edit fixture");
        ngDialog.open({ template: '../fixtureEdit.html', className: 'ngdialog-theme-default', data: x , showClose: false});
    };


    self.showreport = function (id) {
      //console.log("ID=" +this.showReport[id]);
        //if(this.showReport[id] === null || this.showReport[id] === undefined) {
          self.showReport[id] = true;
        //} else {
        //  this.showReport[id] = !this.showReport[id]
        //}
    };

  });



  /***********************
  * NEW PLAYER CONTROLLER.
  ************************/
  App.controller('addPlayerCtl', function($scope, $http, ngDialog) {
    var self = this;

      //This needs to be set to ensure that the request is prperly formed.
      var config = {headers : {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'}}
      self.addPlayer = function() {

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
    });

    /***********************
    * PLAYERS CONTROLLER.
    ************************/
App.controller('playersCtl', function($scope, $http, ngDialog) {
  var self = this;
  self.playerID = {};
  self.player;
  self.showDetails={};


  /*$http.get("/getAllStats").then(function (response) {
      self.stats = response.data;
    });
*/
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


      $http.defaults.headers.post["Content-Type"] = "application/json";
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

  });

  /***********************
  * INDPLAYER CONTROLLER.
  ************************/
App.controller('indPlayerCtl', ['$scope', '$http', '$location', function($scope, $http, $location, ngDialog) {
  var self = this;
  self.mode = [];
  self.showDetails = true;
  self.showSection=[true, true, true, true, true, true, true];
  self.showTechnical = true;
  self.showTactical = true;
  self.showSocial = true;
  self.showPhysical = true;
  self.showPsycological = true;

  console.log($location.search()['id']);
  var id = $location.search()['id'];
  if(id != null) {
  //  id="607";
  }

    $http.get("getPlayer?id=" +id).then(function (response) {
        self.player =   response.data;
      });


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
      $http.post("/updatePlayer", self.player).success(function (data, status, headers, config) {
                this.player = data;
                self.mode.length=0;
              })
              .error(function (data, status, header, config) {
                alert(status);
              });
  };

  //Hack to receive a star clicked event... update player
  $scope.$on('statClicked', function(event, args) {self.updatePlayer();});

}]);


/***********************
* NEWS CONTROLLER.
************************/
  App.controller('newsCtl', function($scope, $http, ngDialog, chatService, authService, $filter, authSvc) {

    var self = this;
    $scope.authSvc = authSvc;
    this.authenticated = authSvc.isAuthenticated();
    count=0;

    $scope.$on('auth', function (event, data) {
      if(data =="login") {
        self.authenticated=true;
      }else if(data=="logout"){
        self.authenticated=false;
      }
    });


    var originatorEv;
    this.openMenu = function($mdOpenMenu, ev) {
      console.log("open");
      originatorEv = ev;
      $mdOpenMenu(ev);
    };

    self.reset = function() {
    console.log(count++);
    };

    var config = {headers : {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'}}
    $http.get("/getNews").then(function (response) {
        self.news = response.data;
      });

      //Fetch all of the news
      $http.get("/getUsers").then(function (response) {
          self.users = response.data;
        });

    self.edit = function(news) {
      ngDialog.open({ template: '../newsEditDialog.html', className: 'ngdialog-theme-default', data: news , showClose: false});
    };


    self.sendChat = function(msg) {
        user=authService.getUsername();
        time=$filter('date')(new Date(), "EEE' 'H:m");
        msg=user+','+time+','+msg;
        chatService.get(msg);
    };

    self.updateNews = function(news) {
      delete news["_id"];
      var data= JSON.stringify(news);
      console.log(data);
      $http.defaults.headers.post["Content-Type"] = "application/json";
        $http.post("/updateNews", data).success(function (data, status, headers, config) {
            ngDialog.close();
          })
          .error(function (data, status, header, config) {
            alert(status);
          });
    };

    self.getUsername = function() {
        return authService.getUsername();
    };

    self.getUserID = function() {
        return authService.getUserID();
    };

    self.isAuthenticated = function() {
      console.log("auth?" +authService.isAuthenticated());
        return authService.isAuthenticated();
    };

  });


  /***********************
  * REGISTRATION CONTROLLER.
  ************************/
    App.controller('registerCtl', function($scope, $http, $mdToast, authSvc) {
      var self = this;
      $scope.authSvc = authSvc;
      //$scope.userSvc = userSvc;
      //var user;
      //var users;

      //Fetch all of the news articles
      var config = {headers : {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'}}
      $http.get("/getNews").then(function (response) {
          self.news = response.data;
        });

        //Fetch user

        //Fetch all of the users
        $http.get("/getUsers").then(function (response) {
            self.users = response.data;
            console.log(self.users.length);

            //if user
            if(authSvc.isAuthenticated) {
              for (i=0;i<self.users.length;i++) {
                if(authSvc.getUserid() == self.users[i].userid) {
                  self.user = self.users[i];
                }
              }
            } else {
              $http.get("../data/user.json").then(function (response) {
                  self.user = response.data;
                });
            }
          });


        self.save = function(dataUrl){
            //console.log("User Saved:" +JSON.stringify(self.user));
            $http.defaults.headers.post["Content-Type"] = "application/json";
            var data = JSON.stringify(self.user);
            $http.post("/addUser", data).success(function (data, status, headers, config) {
                  if(typeof data.username != 'undefined') {
                    var imageData = dataURItoBlob(dataUrl);
                    var fd = new FormData();
                    fd.append('userid', data.userid);
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
                } else {
                  if(data.code == 11000) {
                    $mdToast.show($mdToast.simple()
                        .textContent('Sorry, that username has already been taken. Choose another!')
                        .position('top left' )
                        .hideDelay(6000)
                    );
                  } else {
                    alert(data.caused_by)
                  }
                }
              }).error(function (data, status, header, config) {
                    alert(status);
              });
        };

        self.update = function(dataUrl, picFile){
            //console.log("User Saved:" +JSON.stringify(self.user));
            $http.defaults.headers.post["Content-Type"] = "application/json";
            //remove the ID field as this will fail to update.
            delete self.user["_id"];
            var data = JSON.stringify(self.user);
            $http.post("/updateUser", data).success(function (data, status, headers, config) {
                  if(typeof data.nModified != 1)  {
                    if(picFile != undefined) {
                      var imageData = dataURItoBlob(dataUrl);
                      var fd = new FormData();
                      fd.append('userid', self.user.userid);
                      fd.append('avatar', imageData);

                      $http({url: '/uploadPhoto',
                            method: 'POST',
                            data: fd,
                            transformRequest: angular.identity,
                            headers: {'Content-Type': undefined}
                      }).success(function(){
                        $mdToast.show($mdToast.simple()
                            .textContent('Your profile has been updated!')
                            .position('top left' )
                            .hideDelay(3000)
                        );

                          console.log("Success");
                      }).error(function(){
                          console.log("ERROR");
                      });
                    } else {
                      $mdToast.show($mdToast.simple()
                          .textContent('Your profile has been updated!')
                          .position('top left' )
                          .hideDelay(3000)
                      );
                    }
                } else {
                  if(data.code == 11000) {
                    $mdToast.show($mdToast.simple()
                        .textContent('Sorry, that username has already been taken. Choose another!')
                        .position('top left' )
                        .hideDelay(6000)
                    );                  } else {
                    console.log("Error in updating image");
                    $mdToast.show($mdToast.simple()
                        .textContent('An Error occured in updating the user. Plesae contact your Teamapp Administrator.')
                        .position('top left' )
                        .hideDelay(3000)
                    );
                  }
                }
              }).error(function (data, status, header, config) {
                    alert(status);
              });
        };

        self.upload = function (dataUrl) {
          var imageData = dataURItoBlob(dataUrl);//new Blob([new Uint8Array(dataArray)], {type: mimeString});
          var fd = new FormData();
          fd.append('avatar', imageData);

          $http({
            url: '/uploadPhoto',
            method: 'POST',
            data: fd,
            transformRequest: angular.identity,
            headers: {'Content-Type': undefined}
          })
            .success(function(){
              console.log("Success");
            })
            .error(function(){
              console.log("ERROR");
            });
        };
    });


  /***********************
  * GAME AVAIL CONTROLLER.
  ************************/
  App.controller('gameAvailCtl', function($scope, $http) {
    var self = this;
    self.playerID = {};
    self.availstyle;

      //Fetch all of the games
      var config = {headers : {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'}}
      $http.get("/getFixtures").then(function (response) {
          self.games = response.data;
          self.monthx = 'NONE';
        });

      //Fetch all of the players
      $http.get("/getPlayers").then(function (response) {
          self.players = response.data;
        });

      //On clisking toggle the availability of a player
      self.toggleAvilability = function(player, game) {
          console.log("clicked " +player +game.HOMETEAM +"====" +game.availability[player].available );
          if(game.availability[player].available =="C") {
            game.availability[player].available  = "N";
            this.availstyle="styleNAvail";
          } else if (game.availability[player].available =="N") {
            game.availability[player].available ="A";
            this.availstyle="styleAvail";
          } else if (game.availability[player].available =="A") {
            game.availability[player].available ="S";
            this.availstyle="styleSelected";
          } else if (game.availability[player].available =="S") {
            game.availability[player].available ="P";
            this.availstyle="stylePlayed";
          } else if (game.availability[player].available =="P") {
            game.availability[player].available ="X";
            this.availstyle="styleNoshow";
          } else if (game.availability[player].available =="X") {
            game.availability[player].available ="I";
            this.availstyle="styleInjured";
          } else if (game.availability[player].available =="I") {
            game.availability[player].available ="C";
            this.availstyle="styleClear";
          }
          this.updateFixture(game);

          return  game.availability[player].available;
      };


      /**
      *  Get the player's availability, if the player avail stat is not in ths fixtures then add a default "C" for the player.
      */
      self.getAvailability = function(playerid, game) {
        // iterate through gameavail
        found=false;
        for(i=0; i<game.availability.length;i++) {
          if(game.availability[i].id == playerid) {
            found=true;
              //console.log(playerid + " -- " +JSON.stringify(game.availability[i].available));
            return game.availability[i].available;
          }
        }

        if(!found){ //If not found then add a default for the player.
          game.availability.push({id : playerid , available : "C"});
          //console.log(game.HOMETEAM +'{"id" : ' +playerid +',"available" : "C"}' +'====' +game.availability[game.availability.length-1].available);
          this.updateFixture(game);
          return game.availability[game.availability.length-1].available;

        }
      };

      self.updateFixture = function(fixture) {
        delete fixture["_id"];
        var data= JSON.stringify(fixture);
        //console.log(data);
        //fixture.DATETIME = new Date("2020-09-10T10:30:00.000Z");
        $http.defaults.headers.post["Content-Type"] = "application/json";
        $http.post("/updateFixture", fixture).success(function (fixture, status, headers, config) {

            })
            .error(function (data, status, header, config) {
              alert(status);
            });
      };



      self.getDate = function(date) {

        month = date.substring(5,7);
        day = date.substring(8,10);

        if(month=='01') {
          return day +'-Jan';
        }else if(month=='02') {
          return day +'-Feb';
        }else if(month=='03') {
          return day +'-Mar';
        }else if(month=='04') {
          return day +'-Apr';
        }else if(month=='05') {
          return day +'-May';
        }else if(month=='06') {
          return day +'-Jun';
        }else if(month=='07') {
          return day +'-Jul';
        }else if(month=='08') {
          return day +'-Aug';
        }else if(month=='09') {
          return day +'-Sep';
        }else if(month=='10') {
          return day +'-Oct';
        }else if(month=='11') {
          return day +'-Nov' ;
        }else if(month=='12') {
          return day +'-Dec';
        }
      };

    });



    /***********************
    * STAR CONTROLLER.
    ************************/
App.controller('starController', ['$scope', '$http', function ($scope, $http) {
    $scope.starRating1 = $scope.score.score;
    $scope.starRating2 = $scope.score.score;
    $scope.starRating3 = $scope.score.score;
    $scope.hoverRating1 = $scope.hoverRating2 = $scope.hoverRating3 = 0;

    $scope.click1 = function (param) {
    };

    $scope.mouseHover1 = function (param) {
        //console.log('mouseHover(' + param + ')');
        $scope.hoverRating1 = param;
    };

    $scope.mouseLeave1 = function (param) {
        //console.log('mouseLeave(' + param + ')');
        $scope.hoverRating1 = param + '*';
    };

    $scope.click2 = function (param) {
        console.log('Click');
    };

    $scope.mouseHover2 = function (param) {
        //console.log('mouseHover(' + param + ')');
        $scope.hoverRating1 = param;
    };

    $scope.mouseLeave2 = function (param) {
        //console.log('mouseLeave(' + param + ')');
        $scope.hoverRating2 = param + '*';
    };

    $scope.click3 = function (param) {
        //console.log('Click');
        $scope.score.score = param;
         $scope.$emit('statClicked', '');
    };

    $scope.mouseHover3 = function (param) {
        //console.log('mouseHover(' + param + ')');
        $scope.hoverRating3 = param;
    };

    $scope.mouseLeave3 = function (param) {
        //console.log('mouseLeave(' + param + ')');
        $scope.hoverRating3 = param + '*';
    };

    var config = {headers : {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'}}
    self.updatePlayer = function() {
      alert("x");

    $http.defaults.headers.post["Content-Type"] = "application/json";
    var data = JSON.stringify(self.player);
    $http.post("/updatePlayer", self.player).success(function (data, status, headers, config) {
              this.player = data;
              self.mode.length=0;
            })
            .error(function (data, status, header, config) {
              alert(status);
            });
    };

}]);

/***********************
* TRUST.
************************/
App.filter("trust", ['$sce', function($sce) {
  return function(htmlCode){
    return $sce.trustAsHtml(htmlCode);
  }
}]);


/***********************
* STAR DIRECTIVE.
************************/
App.directive('starRating', function () {
    return {
        scope: { rating: '=', maxRating: '@', readOnly: '@',  click: "&", mouseHover: "&", mouseLeave: "&" },
        restrict: 'EA',
        template:
            "<div style='display: inline-block; margin: 0px; padding: 0px; cursor:pointer;' ng-repeat='idx in maxRatings track by $index'> \
                    <img ng-src='{{((hoverValue + _rating) <= $index) && \"images/icons/star-empty-lg.png\" || \"images/icons/star-fill-lg.png\"}}' \
                    ng-Click='isolatedClick($index + 1)' \
                    ng-mouseenter='isolatedMouseHover($index + 1)' \
                    ng-mouseleave='isolatedMouseLeave($index + 1)'></img> \
            </div>",
        compile: function (element, attrs) {
            if (!attrs.maxRating || (Number(attrs.maxRating) <= 0)) {
                attrs.maxRating = '5';
            };
        },
        controller: function ($scope, $element, $attrs) {
            $scope.maxRatings = [];

            for (var i = 1; i <= $scope.maxRating; i++) {
                $scope.maxRatings.push({});
            };

            $scope._rating = $scope.rating;

      			$scope.isolatedClick = function (param) {
      				if ($scope.readOnly == 'true') return;

      				$scope.rating = $scope._rating = param;
      				$scope.hoverValue = 0;
      				$scope.click({param: param});
      			};

      			$scope.isolatedMouseHover = function (param) {
      				if ($scope.readOnly == 'true') return;

      				$scope._rating = 0;
      				$scope.hoverValue = param;
      				$scope.mouseHover({param: param});
      			};

      			$scope.isolatedMouseLeave = function (param) {
      				if ($scope.readOnly == 'true') return;

      				$scope._rating = $scope.rating;
      				$scope.hoverValue = 0;
      				$scope.mouseLeave({param: param});
			      };
        }
    };
});

/***********************
* STAR DIRECTIVE. Directive to enable dynamic ng-model elements to be created from JSON input
************************/
App.directive('dynamicModel', ['$compile', '$parse', function ($compile, $parse) {
    return {
        restrict: 'A',
        terminal: true,
        priority: 100000,
        link: function (scope, elem) {
            var name = $parse(elem.attr('dynamic-model'))(scope);
            elem.removeAttr('dynamic-model');
            elem.attr('ng-model', name);
            $compile(elem)(scope);
        }
    };
}]);


/****************************************************************************
** Main angular controler
*****************************************************************************/
//angular
//  .module('MyApp',['ngMaterial', 'ngMessages', 'ngMdIcons'])
  App.controller('AppCtrl', function ($scope, $timeout, $mdSidenav, $log) {
    $scope.toggleLeft = buildDelayedToggler('left');
    $scope.toggleRight = buildToggler('right');
    $scope.isOpenRight = function(){
      return $mdSidenav('right').isOpen();
    };

    /**
     * Supplies a function that will continue to operate until the
     * time is up.
     */
    function debounce(func, wait, context) {
      var timer;

      return function debounced() {
        var context = $scope,
            args = Array.prototype.slice.call(arguments);
        $timeout.cancel(timer);
        timer = $timeout(function() {
          timer = undefined;
          func.apply(context, args);
        }, wait || 10);
      };
    }

    /**
     * Build handler to open/close a SideNav; when animation finishes
     * report completion in console
     */
    function buildDelayedToggler(navID) {
      return debounce(function() {
        // Component lookup should always be available since we are not using `ng-if`
        $mdSidenav(navID)
          .toggle()
          .then(function () {
            $log.debug("toggle " + navID + " is done");
          });
      }, 200);
    }

    function buildToggler(navID) {
      return function() {
        // Component lookup should always be available since we are not using `ng-if`
        $mdSidenav(navID)
          .toggle()
          .then(function () {
            $log.debug("toggle " + navID + " is done");
          });
      }
    }
  })
  .controller('LeftCtrl', function ($scope, $timeout, $mdSidenav, $log) {
    $scope.close = function () {
      // Component lookup should always be available since we are not using `ng-if`
      $mdSidenav('left').close()
        .then(function () {
          $log.debug("close LEFT is done");
        });

    };
  })
  .controller('RightCtrl', function ($scope, $timeout, $mdSidenav, $log) {
    $scope.close = function () {
      // Component lookup should always be available since we are not using `ng-if`
      $mdSidenav('right').close()
        .then(function () {
          $log.debug("close RIGHT is done");
        });
    };
  });


/*****************************************
*  MYCtrl
******************************************/
  App.controller('MyCtrl', ['$http','$scope', '$timeout', function ($http, $scope, $timeout) {


    $scope.upload = function (dataUrl, name) {

      var imageData = dataURItoBlob(dataUrl);//new Blob([new Uint8Array(dataArray)], {type: mimeString});
      var fd = new FormData();
      fd.append('avatar', imageData);

      $http({
        url: '/uploadPhoto',
        method: 'POST',
        data: fd,
        transformRequest: angular.identity,
        headers: {'Content-Type': undefined}
      })
        .success(function(){
          console.log("Success");
        })
        .error(function(){
          console.log("ERROR");
        });
    };

  }]);


  function dataURItoBlob(dataURI) {
      var binary = atob(dataURI.split(',')[1]);
      var array = [];
      for(var i = 0; i < binary.length; i++) {
          array.push(binary.charCodeAt(i));
      }
      return new Blob([new Uint8Array(array)], {type: 'image/jpeg'});
  }

/*
          Upload.upload({
              url: '/uploadPhoto',
              data: {
                  file: Upload.dataUrltoBlob(dataUrl, name)
              },
          }).then(function (response) {
              $timeout(function () {
                  $scope.result = response.data;
              });
          }, function (response) {
              if (response.status > 0) $scope.errorMsg = response.status
                  + ': ' + response.data;
          }, function (evt) {
              $scope.progress = parseInt(100.0 * evt.loaded / evt.total);
          });
      }
  }]);*/

  //inject ngFileUpload and ngImgCrop directives and services.
var App2 = angular.module('fileUpload', ['ngFileUpload', 'ngImgCrop']);

App2.controller('MyCtrl', ['$scope', 'Upload', '$timeout', function ($scope, Upload, $timeout) {
    $scope.upload = function (dataUrl, name) {
        Upload.upload({
            url: 'uploadPhoto',
            data: {file: Upload.dataUrltoBlob(dataUrl, name)},
        }).then(function (response) {
            $timeout(function () {
                $scope.result = response.data;
            });
        }, function (response) {
            if (response.status > 0) $scope.errorMsg = response.status
                + ': ' + response.data;
        }, function (evt) {
            $scope.progress = parseInt(100.0 * evt.loaded / evt.total);
        });
    }
}]);
