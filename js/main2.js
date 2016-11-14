var App = angular.module('myApp',['ngMaterial', 'ngMessages', 'ngMdIcons','ngCookies','textAngular', 'ngWebSocket']);
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
* NEWS CONTROLLER.
************************/
  App.controller('newsCtl', function($scope, $http, ngDialog, chatService, authService, $filter, authSvc) {

    var self = this;
    $scope.authSvc = authSvc;
    this.authenticated = authSvc.isAuthenticated();

    $scope.$on('auth', function (event, data) {
      if(data =="login") {
        self.authenticated=true;
      }else if(data=="logout"){
        self.authenticated=false;
      }
    });

    //Fetch all of the news
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
  var showReport = [];
  self.fixID = {};

  this.topDirections = ['left', 'up'];
  this.bottomDirections = ['down', 'right'];
  this.isOpen = false;
  this.availableModes = ['md-fling', 'md-scale'];
  this.selectedMode = 'md-fling';
  this.availableDirections = ['up', 'down', 'left', 'right'];
  this.selectedDirection = 'up';


  var config = {headers : {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'}}
  $http.get("/getFixtures").then(function (response) {
      self.games = response.data;
      self.monthx = 'NONE';
    });

    self.showMonth = function(newmonth) {
      //console.log(newmonth +" " +self.monthx);
      if(newmonth != self.monthx) {
        self.monthx = newmonth;
        return true;
      } else {
        return false;
      }
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
        ngDialog.open({ template: '../fixtureEdit.html', className: 'ngdialog-theme-default', data: x , showClose: false});
    };

    self.showreport = function (id) {
        console.log("ID=" +id);
        //;games.showReport[x.ID] = !games.showReport[x.ID]
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
            url: 'http://www.graeme.co/uploadPhoto',
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
