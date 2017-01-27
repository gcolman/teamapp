var App = angular.module('myApp',['ngMaterial', 'ngMessages', 'ngMdIcons','ngDialog','ngCookies','textAngular', 'ngWebSocket','ngFileUpload', 'ngImgCrop', 'ngRoute', 'googlechart', 'percentCircle-directive', angularDragula(angular), 'digestHud']);
'use strict';


/*****************************************************************
* Message Factory
*****************************************************************/
App.factory('messageService', function($websocket, $http) {
   // Open a WebSocket connection
   var mailService = {};
   var dataStream = $websocket('ws://www.graeme.com:8001/msg');
   var chatCollection = [];
   var mailCollection = [];

   dataStream.onMessage(function(message) {
     if( message.data.split(',')[0] == "prediction" ){
         chatCollection.unshift(message.data);
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
       chatCollection.length = 0;
     },
     loginMail: function(){
       chatCollection.length=0;
       dataStream.send("NEW_CONNECT,prediction");
     },
     getMessages: function(to, club, team){
       //console.log("Getting messages");
      $http.get("/getMessages?to=" +to +"&club=" ).then(function (response) {
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



/****************************************************************************
** Main app controler
*****************************************************************************/
  App.controller('appCtrl', function ($scope, $location, $cookies, $http, $mdToast, $filter, messageService) {
  var self = this;
  self.messageService = messageService;
  self.username;
  self.email;
  self.password;
  self.user = {};
  self.displayedUser = {};
  self.loggedin = false;
  self.loggedinUser;
  self.loginName="Graeme";
  self.loginPassword="pw";
  var s = $location.search();

   var originatorEv;
   this.openMenu = function($mdOpenMenu, ev) {
     //console.log("open");
     originatorEv = ev;
     $mdOpenMenu(ev);
   };

   //db, collection, sorted, sortfield, ascdesc
   $http.get("getCollection?collection=prediction.users&sorted=true&sortfield=totalpoints&ascdesc=desc").then(function (response) {
     self.players = response.data;
     self.displayedUser = self.players[0];
     //console.log(JSON.stringify(self.players));
   });

   //db, collection, sorted, sortfield, ascdesc
   $http.get("getCollection?collection=prediction.fixtures&sorted=true&sortfield=gameid&ascdesc=assc").then(function (response) {
     self.fixtures = response.data;
     //console.log(JSON.stringify(self.fixtures));
   });


   this.register = function() {
     $http.defaults.headers.post["Content-Type"] = "application/json";
     self.user.username = self.username;
     self.user.email=self.email;
     self.user.password=self.password;
     self.user.fixtures = self.fixtures;
     var data = JSON.stringify(self.user);
     //console.log("SAVE " +data);
     $http.post("/add?collection=prediction.users", data).success(function (data, status, headers, config) {
       $http.get("getCollection?collection=prediction.users&sorted=true&sortfield=totalpoints&ascdesc=desc").then(function (response) {
         self.players = response.data;
         $mdToast.show($mdToast.simple().textContent("Welcome " +self.username +". Now just login in over there to start!").position("top left").hideDelay(3000));
         self.sendChat(self.username +" has just registerd to play.");
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
            self.fixtures = this.user.fixtures;
            self.displayedUser = this.user;
            messageService.loginMail();
            self.sendChat(self.loggedinUser +" just logged in.");
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
      delete self.fixtures._id;
      delete self.user._id;
      self.user.fixtures = self.fixtures;
      data = JSON.stringify(self.user);
      $http.defaults.headers.post["Content-Type"] = "application/json";
      $http.post("/updateCollection?collection=prediction.users&key=username&id=" +self.user.username, data).success(function (data, status, headers, config) {
          $mdToast.show($mdToast.simple().textContent("Your predctions have been updated").position("top left").hideDelay(3000));
          self.sendChat(self.loggedinUser +" has just updated his predictions.");
        })
        .error(function (data, status, header, config) {
          $mdToast.show($mdToast.simple().textContent("Whoops! Something went wrong... it'll be John's fault!  " +status).position("top left").hideDelay(3000));
          });


    }

  self.viewUser = function(player) {
    /*for(q=0;q<self.players.length;q++) {
      if(self.players[q].username == player.username) {
        displayUser = player;
      }
    }*/
    self.displayedUser = player;
    //$mdToast.show($mdToast.simple().textContent("Woohoo " +player.username).position("top left").hideDelay(3000));
  }


  self.sendChat = function(msg) {
      time=$filter('date')(new Date(), "EEE' 'H:m");
      msg='prediction,' +self.loggedinUser+','+time+','+msg;
      //msg=user+','+time+','+msg;
      messageService.sendMsg(msg);
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
