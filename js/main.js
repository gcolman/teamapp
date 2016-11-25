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
  * Message Factory
  *****************************************************************/
  App.value('properties',{
    username: "Rob",
    teamName:"Opals",
    teamId:90,
    clubName:"FC Chippenham Youth",
    clubId:67,
    ageGroup: "U12",
    bg: "Girls"
  });

  App.service('props', function() {
    this.username = "Rob";
    this.teamName ="Opals";
    this.teamId ="90";
    this.clubName = "FC Chippenham Youth";
    this.clubId = "67";
    this.ageGroup= "U12";
    this.bg ="Girls";

    this.setClubName = function(clubName) {
      console.log("Setting club to " +clubName);
      this.clubName = clubName;
    };

    this.getClubName = function() {
      console.log("Getting clubname" +this.clubName);
      return this.clubName;
    };
  });

  /*****************************************************************
  * Message Factory
  *****************************************************************/
  App.factory('messageService', function($websocket, authSvc, $http) {
     // Open a WebSocket connection
     var mailService = {};
     //TODO externalise
     var dataStream = $websocket('ws://www.graeme.com:8001/msg');
     var chatCollection = [];
     var mailCollection = [];


     $http.get("/getMessages?to=" +authSvc.getUsername()).then(function (response) {
         for(i=0;i<response.data.length;i++) {
           if(response.data[i].to != undefined && response.data[i].to != "") {
             //console.log("MAILSVC1 PUSHING = " +JSON.stringify(response.data[i]));
             mailCollection.push(response.data[i]);
           }
         }
       });

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
       } else {
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
      },
      getRole : function() {
        return $cookies.get("role");
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
              $cookies.put("role", data[0].authrole);
              $cookies.put("id", data[0].userid);
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
  App.controller('appCtrl', function ($scope, $location, $cookies, props) {
  var self = this;
  this.prop = props;
  self.view = "news_view";
  var s = $location.search();
  console.log("PROPERTIES" +props.getClubName());
  //props.setClubName("lolololo");
  //if team and club infor has been passed then set this on the browser
  //properties.clubId = s.clubId
  //properties.teamId = s.teamId
  $cookies.put("club", s.club);
  $cookies.put("team", s.team);

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

App.controller('newsCtl', function ($scope, $http, ngDialog) {
  var self = this;
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
  * INDPLAYER CONTROLLER.
  ************************/
App.controller('indPlayerCtl', ['$scope', '$http','$window', function($scope, $http, $window, ngDialog) {
  var self = this;
  self.mode = [];
  self.showDetails = true;
  self.showSection=[true, true, true, true, true, true, true];
  self.showTechnical = true;
  self.showTactical = true;
  self.showSocial = true;
  self.showPhysical = true;
  self.showPsycological = true;

  //console.log($window.location.search.substring(4));//$location.search()['id']);
  var id = window.location.search.substring(4);//$routeParams.id;//$location.search()['id'];
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
