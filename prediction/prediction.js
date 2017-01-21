var App = angular.module('myApp',['ngMaterial', 'ngMessages', 'ngMdIcons','ngDialog','ngCookies','textAngular', 'ngWebSocket','ngFileUpload', 'ngImgCrop', 'ngRoute', 'googlechart', 'percentCircle-directive', angularDragula(angular), 'digestHud']);
'use strict';


/****************************************************************************
** Main app controler
*****************************************************************************/
  App.controller('appCtrl', function ($scope, $location, $cookies, $http, $mdToast) {
  var self = this;
  self.username;
  self.email;
  self.password;
  self.user = {};
  self.loggedin = false;
  self.loggedinUser;
  self.loginName="username";
  self.loginPassword="password";
  var s = $location.search();

   var originatorEv;
   this.openMenu = function($mdOpenMenu, ev) {
     console.log("open");
     originatorEv = ev;
     $mdOpenMenu(ev);
   };

   //db, collection, sorted, sortfield, ascdesc
   $http.get("getCollection?collection=prediction.users&sorted=true&sortfield=totalpoints&ascdesc=desc").then(function (response) {
     self.players = response.data;
     console.log(JSON.stringify(self.players));
   });

   //db, collection, sorted, sortfield, ascdesc
   $http.get("getCollection?collection=prediction.fixtures&sorted=true&sortfield=gameid&ascdesc=assc").then(function (response) {
     self.fixtures = response.data;
     console.log(JSON.stringify(self.fixtures));
   });


   this.register = function() {
     $http.defaults.headers.post["Content-Type"] = "application/json";
     self.user.username = self.username;
     self.user.email=self.email;
     self.user.password=self.password;
     self.user.fixtures = self.fixtures;
     var data = JSON.stringify(self.user);
     console.log("SAVE " +data);
     $http.post("/add?collection=prediction.users", data).success(function (data, status, headers, config) {
       $http.get("getCollection?collection=prediction.users&sorted=true&sortfield=totalpoints&ascdesc=desc").then(function (response) {
         self.players = response.data;
         $mdToast.show($mdToast.simple().textContent("Welcome " +self.username +". Now just login in over there to start!").position("top left").hideDelay(3000));
       });

       })
       .error(function (data, status, header, config) {
         $mdToast.show($mdToast.simple().textContent("Whoops! Something went wrong... it'll be John's fault!  " +status).position("top left").hideDelay(3000));
         });
    }

    this.login = function() {
      for(x=0;x<self.players.length;x++) {
        if(self.players[x].username == self.loginName) {
          if(self.players[x].password == self.loginPassword) {
            this.loggedin = true;
            this.loggedinUser = this.loginName;
            this.user = self.players[x];
            $mdToast.show($mdToast.simple().textContent("Logged in as " +self.loggedinUser).position("top right").hideDelay(3000));
          } else {
            $mdToast.show($mdToast.simple().textContent("Ooh, wrong password... " +self.loginName).position("top right").hideDelay(3000));
            return;
          }
        }
      }
      if(!self.loggedin) {
        $mdToast.show($mdToast.simple().textContent("Sorry, couldn't find the user " +self.loginName).position("top right").hideDelay(3000));
      }
    }

    this.savePredictions = function() {
      console.log(">>" +JSON.stringify(self.fixtures));
      delete self.fixtures._id;
      delete self.user._id;
      self.user.fixtures = self.fixtures;
      console.log("<<<<" +JSON.stringify(self.user));
      data = JSON.stringify(self.user);
      $http.defaults.headers.post["Content-Type"] = "application/json";
      $http.post("/updateCollection?collection=prediction.users&key=username&id=" +self.user.username, data).success(function (data, status, headers, config) {
          $mdToast.show($mdToast.simple().textContent("Your predctions have been updated").position("top left").hideDelay(3000));
        })
        .error(function (data, status, header, config) {
          $mdToast.show($mdToast.simple().textContent("Whoops! Something went wrong... it'll be John's fault!  " +status).position("top left").hideDelay(3000));
          });


    }


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
