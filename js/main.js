
var App = angular.module('myApp',['ngMaterial', 'ngMessages', 'ngMdIcons','ngDialog','ngCookies','textAngular', 'ngWebSocket','ngFileUpload', 'ngImgCrop', 'ngRoute', 'googlechart', 'percentCircle-directive', angularDragula(angular), 'digestHud']);
'use strict';



App.config( [ 'digestHudProvider', function( digestHudProvider ) {
    digestHudProvider.enable();
  // Optional configuration settings:
  digestHudProvider.setHudPosition('top right'); // setup hud position on the page: top right, bottom left, etc. corner
  digestHudProvider.numTopWatches = 20;  // number of items to display in detailed table
  digestHudProvider.numDigestStats = 25;  // number of most recent digests to use for min/med/max stats
}]);

App.config( [ '$locationProvider', function( $locationProvider ) {
   $locationProvider.html5Mode( true );
}]);


App.config(function($mdThemingProvider) {
  $mdThemingProvider.theme('dark-grey').backgroundPalette('grey').dark();
  $mdThemingProvider.theme('dark-orange').backgroundPalette('orange').dark();
  $mdThemingProvider.theme('dark-purple').backgroundPalette('deep-purple').dark();
  $mdThemingProvider.theme('dark-blue').backgroundPalette('blue').dark();
  });

  App.config(function($routeProvider) {
      $routeProvider
      .when("/", {
          templateUrl : "routes/main.html",
          controller : "mainController"
      })
      .when("/main", {
          templateUrl : "routes/main.html",
          controller : "mainController"
      })
      .when("/index", {
          templateUrl : "routes/news.html",
          controller : "newsController"
      })
      .when("/fixtures", {
          templateUrl : "routes/fixtures.html",
          controller : "fixtureController"
      })
      .when("/players", {
          templateUrl : "routes/players.html",
          controller : "playersController"
      })
      .when("/stats", {
          templateUrl : "routes/stats.html",
          controller : "statsController"
      })
      .when("/admin", {
          templateUrl : "routes/admin.html",
          controller : "adminController"
      })
      .when("/register", {
          templateUrl : "routes/register.html"
      })
      .when("/userRegistration", {
          templateUrl : "routes/user.html",
          controller : "userController"
      })
      .when("/player", {
          templateUrl : "routes/player.html",
          controller : "playerController",
      })
      .when("/availability", {
          templateUrl : "routes/availability.html",
          controller : "availabilityController"
      })
      .when("/lineup", {
          templateUrl : "routes/lineup.html",

    });
  });


  /*****************************************************************
  * Message Factory
  *****************************************************************/
  App.value('properties',{
    username: "",
    userid: 00,
    myClub: 00,
    myTeam: 00,
    selectedClub: {},
    selectedTeam: {},
    teamName:"",
    teamId:00,
    clubName:"",
    clubId: 00,
    authRole: "",
    ageGroup: "",
    bg: "",
    alphaClub: "",
    alphaTeam: "",
    fixtures: {},
    players: {}
  });



  /*****************************************************************
  * Message Factory
  *****************************************************************/
  App.factory('messageService', function($websocket, authSvc, $http, properties) {
     // Open a WebSocket connection
     var mailService = {};
     //TODO externalise
     var dataStream = $websocket('ws://www.graeme.com:8001/msg');
     var chatCollection = [];
     var mailCollection = [];

     console.log("Getting the Messages for " +authSvc.getUsername());

  /*   $http.get("/getMessages?to=" +authSvc.getUsername()+"&club=" +properties.alphaClub +"&team=" +properties.alphaTeam).then(function (response) {
         for(i=0;i<response.data.length;i++) {
           if(response.data[i].to != undefined && response.data[i].to != "") {
             //console.log("MAILSVC1 PUSHING = " +JSON.stringify(response.data[i]));
             mailCollection.push(response.data[i]);
           }
         }
       });
*/
     dataStream.onMessage(function(message) {
       console.log("msg Received" +message.data);
         if(message.data != undefined && message.data.substring(0,6) == "REMOVE") {
           id=message.data.substring(7,message.data.length);
           for(i=0;i<mailCollection.length;i++) {
             if(mailCollection[i]._id == id) {
               mailCollection.splice(i,1);
             }
           }
         } else if(message.data != undefined && message.data[0] == "{") {
           msgObject = JSON.parse(message.data);
           //console.log(JSON.stringify(message.data) +" TO" +x.to +" USERNAME=" +authSvc.getUsername() );
           if(msgObject.to == authSvc.getUsername()) {
               //console.log("MAILSVC2 PUSHING" +JSON.stringify(msgObject));
             mailCollection.push(JSON.parse(message.data));
           }
         } else if( message.data.split(',')[0] == properties.alphaClub + properties.alphaTeam ){
           chatCollection.push(message.data);
         }

     });

     dataStream.onClose(function() {
       //console.log(">>>RECONNECT WS");
       dataStream = $websocket('ws://www.graeme.com:8001/msg');
     });


     var methods = {
       chatCollection: chatCollection,
       mailCollection: mailCollection,
       get: function(msg) {
         console.log(dataStream);
         dataStream.send(msg);
       },
       sendMsg: function(msg) {
         dataStream.send(msg);
       },
       getChatMsg: function(){
         return chatCollection;
       },
       getMailMsg: function(){
         return mailCollection;
       },
       logoutMail: function(){
         console.log("LOGOUT MAIL");
         mailCollection.length = 0;
         //chatCollection.length=0;
       },
       loginMail: function(){
         dataStream.send("NEW_CONNECT," +properties.alphaClub +properties.alphaTeam);
       },
       getMessages: function(to, club, team){
         //console.log("Getting messages");
        $http.get("/getMessages?to=" +to +"&club=" +properties.alphaClub  +"&team=" +properties.alphaTeam ).then(function (response) {
          mailCollection.length=0;
           for(i=0;i<response.data.length;i++) {
             if(response.data[i].to != undefined && response.data[i].to != "") {
               //console.log("MAILSVC1 PUSHING = " +JSON.stringify(response.data[i]));
               mailCollection.push(response.data[i]);
             }
           }
         });

      }
     };

     return methods;
   });



   /*******************************
   * Auth Factory Service
   ********************************/
   App.factory('authSvc', function($rootScope, $cookies, hashService, properties) {
     var view = "news_view";
     var currentPlayer = "0";
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
      },
      getRole : function() {
        return $cookies.get("role");
      },
      isInTeam : function(team){
        //console.log("IS IN TEAM " + properties.myTeam +properties.teamId);
        for(i=0;i <team.members.length;i++) {
          if(properties.myTeam == team.members[i]) {
            return true;
          }
        }
        for(i=0;i <team.administrators.length;i++) {
          if(properties.myTeam == team.members[i]) {
            return true;
          }
        }
        return false;
      },
      isTeamAdmin : function(){
        return $cookies.get("ita");
      },
      isAppAdmin : function() {
        if($cookies.get("iaa")>100000) {
            return true;
        } else {
          return false;
        }
      },
      getView : function(){
        return self.view;
      },
      setView : function(view){
        self.view = view;
      },
      getCurrentPlayer : function(){
        return self.currentPlayer;
      },
      setCurrentPlayer : function(playerId){
        self.currentPlayer = playerId;
      },
      logout : function(){
        $cookies.remove("a199hhy78327772679hhy");
        $cookies.remove("user");
        $cookies.remove("role");
        $cookies.remove("id");
        $cookies.remove("username");
        $cookies.remove("myClub");
        $cookies.remove("myTeam");
        $rootScope.$broadcast('auth', 'logout');
      }

    }
  });


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

    this.alpha = function(num) {
      str = num.toString();
      res = "";
      for(alphacount=0;alphacount<str.length;alphacount++) {
        res = res + String.fromCharCode(97 + parseInt(str[alphacount]));
      }
        return res;
    };

});


/**
*  Help service - to display help messages throughout the app
*/
App.service('helpService', function ($mdDialog, properties) {
    this.showHelp = function(view) {
      // popup the help dialog

    };
});


/**
* Auth Service
*
*/
App.service('authService', function($rootScope, $http, $cookies, ngDialog, hashService, messageService, properties) {

  this.login = function(credential) {
      if(credential != undefined) {
        delete credential["_id"];
      } else {
        credential = {};
        credential.username = "coach";
        credential.password = "pw";
      }
      var data = JSON.stringify(credential);
      console.log(">>>" +data);

      if(credential == undefined) {
        data.userid = "coach";
        data.password = "pw";
      }

      $http.defaults.headers.post["Content-Type"] = "application/json";
      $http.post("/login", data).success(function (data, status, headers, config) {
            if(data[0] != null) {
              //Check if the user is valid for the club and
              console.log("SUCCESS" +JSON.stringify(data));
              $cookies.put("a199hhy78327772679hhy", hashService.hash(data[0].username, ""));
              $cookies.put("user", data[0].username);
              $cookies.put("role", data[0].authrole);
              $cookies.put("id", data[0].userid);
              $cookies.put("username", data[0].username);
              $cookies.put("myClub", data[0].club);
              $cookies.put("myTeam", data[0].team);
              properties.username=data[0].username;
              properties.myClub = data[0].club;
              properties.myTeam = data[0].team;
              properties.authRole = data[0].authrole;
              properties.userid = data[0].userid;
              if(data[0].authrole == "teamadmin") {
                $cookies.put("ita", 900000 );
              }
              if(data[0].authrole == "appadmin") {
                $cookies.put("iaa", 800000);
              }
              $rootScope.$broadcast('auth', 'login');
            } else {
              console.log("FAIL");
              alert("invalid username or password");
            }
            ngDialog.close();
            messageService.getMessages( data[0].username, properties.alphaClub, properties.alphaTeam);
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
/****************************************************************************
** Main app controler
*****************************************************************************/
  App.controller('appCtrl', function ($scope, $location, $cookies, properties, authSvc, hashService) {
  var self = this;
  self.properties = properties;
  self.authSvc = authSvc;
  authSvc.setView("news_view");
  var s = $location.search();

  //console.log("IN APPCTRL");

  // if a view url param is set then use that
  var requestedView = s.view;//window.location.search.substring(6);//$routeParams.view;//$location.search()['view'];
  if(requestedView != null) {
    //console.log("using requested view " +requestedView);
    self.view = requestedView;
  }

   var originatorEv;
   this.openMenu = function($mdOpenMenu, ev) {
     console.log("open");
     originatorEv = ev;
     $mdOpenMenu(ev);
   };

 });


/***********************
* WEB SOCKET CONTROLLER.
************************/
App.controller('wsCtl', function ($scope, messageService) {
  $scope.messageService = messageService;
});


/***********************
* PLAYERS CONTROLLER.
************************/
App.controller('playersCtl', function ($scope, $http, ngDialog) {
var self = this;
self.playerID = {};
self.player;
self.showDetails={};

$http.defaults.headers.post["Content-Type"] = "application/json";
$http.get("/getPlayersWithStats").then(function (response) {
    self.names = response.data;
  });


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

});

App.controller('newsCtl', function ($scope, $http, ngDialog, properties) {
  var self = this;
  self.updateNews = function(news) {
    delete news["_id"];

    var data= JSON.stringify(news);
    console.log(data);
    $http.defaults.headers.post["Content-Type"] = "application/json";
      $http.post("/updateNews?club=" +properties.alphaClub +"&team=" +properties.alphaTeam , data).success(function (data, status, headers, config) {
          ngDialog.close();
        })
        .error(function (data, status, header, config) {
          alert(status);
        });
  };
});

/***********************
* AUTH CONTROLLER.
************************/
App.controller('authCtl', function($scope, $rootScope, $cookies, authService, ngDialog, hashService, messageService) {
  var self = this;

  self.dologin = function(credential) {
    ngDialog.open({ template: '../loginDialog.html', className: 'ngdialog-theme-default', data: credential , showClose: false});
  };

 self.login = function(credential) {
    authService.login(credential);
    messageService.loginMail();
  };

  self.logout = function() {
    $cookies.remove("a199hhy78327772679hhy");
    $cookies.remove("user");
    $cookies.remove("role");
    $cookies.remove("id");
    $rootScope.$broadcast('auth', 'logout');
    messageService.logoutMail();
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
* TRUST.
************************/
App.filter("trust", ['$sce', function($sce) {
  return function(htmlCode){
    return $sce.trustAsHtml(htmlCode);
  }
}]);

/***********************
* SELECTOR DIRECTIVE DIRECTIVE.
************************/
App.directive('playerdiv', function () {
    return {
        scope: { squadno: "@", player: "@", playerid: "@"},
        restrict: 'EA',
        template:
          "<div id=\"{{playerid}}\" align=\"center\"><img class=\"md-user-avatar\" src=\"images/people/players/player{{squadno}}.aspx\" style=\"width:35px\"/> \
            <div style=\"text-align:center\"> \
            {{player}} \
          </div> \
          </div>"
    };
});




/***********************
* Directive to enable dynamic ng-model elements to be created from JSON input
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
