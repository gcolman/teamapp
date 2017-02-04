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
  self.loginName="";
  self.loginPassword="";
  self.table = [];
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

     //db, collection, sorted, sortfield, ascdesc
     $http.get("getCollection?collection=prediction.fixtures&sorted=true&sortfield=gameid&ascdesc=assc").then(function (response) {
       self.fixtures = response.data;
       self.results = response.data;
       //console.log(JSON.stringify(self.fixtures));
       self.calcTable();
     });

   });



   this.calcTable = function() {
     //iterate through the users calculating the points
     // empty the array
     self.table.length = 0;
     var Row = function Row() {
     }



     for(player in self.players) {
       var row = new Row();
       row.player =  self.players[player].username;
       row.wins=0;
       row.exactscores=0;
       row.scoredif=0;
      //for each player, iterate through the results and work out points and
       for ( fixture in self.players[player].fixtures) {
         var result = self.getResult(self.players[player].fixtures[fixture].gameid);
         // got the result for this fixture. calculate result homewin or away win.
         //console.log(result.homescore +" - " +result.awayscore);
         if(result.homescore > result.awayscore) {
           if(self.players[player].fixtures[fixture].homescore > self.players[player].fixtures[fixture].awayscore) {
             // correct result
             //console.log("CORRECT SCORE FOR " +self.players[player].username);
              row.wins = row.wins+1;
              row.exactscores = row.exactscores +this.corectScores(self.players[player].fixtures[fixture], result);
              row.scoredif += this.scoredif(self.players[player].fixtures[fixture], result);
           } else {

             row.scoredif += this.scoredif(self.players[player].fixtures[fixture], result);
             console.log(row.player +"   " +row.scoredif);
           }
         } else if(result.homescore < result.awayscore){
           if(self.players[player].fixtures[fixture].homescore < self.players[player].fixtures[fixture].awayscore) {
             // correct result
             row.wins = row.wins+1;
             row.exactscores = row.exactscores +this.corectScores(self.players[player].fixtures[fixture], result);
             row.scoredif += this.scoredif(self.players[player].fixtures[fixture], result);
           } else {
             row.scoredif += this.scoredif(self.players[player].fixtures[fixture], result);
           }
         }
       }
       row.totalpoints = (row.wins*3) + (row.exactscores*3) ;
         if(self.table.length <= 0) {
           //if the first entry then just add to array
           self.table[0] = row;
         } else {
           for(pos=0;pos<self.table.length;pos++){
             if(self.table[pos].totalpoints < row.totalpoints) {
                  //if more points than pos then add to that index and shift right
                 self.table.splice(pos, 0, row)
                 break;
             } else if(pos+1 == self.table.length) {
               //last element?
                 self.table[pos+1]=row;
                 break;
             }else if (self.table[pos].totalpoints == row.totalpoints){
               if(self.table[pos].scoredif > row.scoredif) {
                 self.table.splice(pos+1, 0, row)
                 break;
               } else if (self.table[pos+1].totalpoints != row.totalpoints) {
                 self.table.splice(pos+1, 0, row)
                 break;
               }
             }
             if(pos+1 == self.table.length) {
               self.table[pos+1] = row;
               break;
             }
         }

       }
       //console.log(self.table[player]);
     }
     console.log(JSON.stringify(self.table));
   };


   this.getResult = function(id) {
     for(game in self.results){
       if(self.results[game].gameid == id) {
         return self.results[game];
       }
     }
   }

   this.corectScores = function(fix, result){
     if(result.homescore == fix.homescore && result.awayscore == fix.awayscore) {
       return 1;
     } else {
       return 0;
     }
   }

   this.scoredif = function(fix, result){
     a = Math.abs(result.homescore - fix.homescore);
     b = Math.abs(result.awayscore - fix.awayscore);
     console.log(fix.username +"SCOREDIF  " +result.homescore +"-" +result.awayscore +" ---- "  +fix.homescore +"-" +fix.awayscore +" = " +a +" / "+b);
     return a+b;
   }


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
         //$mdToast.show($mdToast.simple().textContent("Welcome " +self.username +". Now just login in over there to start!").position("top left").hideDelay(3000));
         self.sendChat(self.username +" has just registerd to play.");

         if(data.code == 11000) {
           $mdToast.show($mdToast.simple()
               .textContent('Sorry, that username has already been taken. Choose another!')
               .position('top left' )
               .hideDelay(6000)
           );
         } else {
           $mdToast.show($mdToast.simple().textContent("Welcome " +self.username +". Now just login in over there to start!").position("top left").hideDelay(3000));
         }
       });
       })
       .error(function (data, status, header, config) {
//         $mdToast.show($mdToast.simple().textContent("Whoops! Something went wrong... it'll be John's fault!  " +status).position("top left").hideDelay(3000));

         if(data.code == 11000) {
           $mdToast.show($mdToast.simple()
               .textContent('Sorry, that username has already been taken. Choose another!')
               .position('top left' )
               .hideDelay(6000)
           );
         } else {
           $mdToast.show($mdToast.simple().textContent("Whoops! Something went wrong... it'll be John's fault!  " +status).position("top left").hideDelay(3000));
         }

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

    this.saveResults = function() {
      for(result in self.results) {
        r = self.results[result];
        delete r._id;
        data = JSON.stringify(r);
        $http.defaults.headers.post["Content-Type"] = "application/json";
        $http.post("/updateCollection?collection=prediction.fixtures&key=gameid&id=" +r.gameid, data).success(function (data, status, headers, config) {
            $mdToast.show($mdToast.simple().textContent("Results have been updated").position("top left").hideDelay(3000));
            self.sendChat(self.loggedinUser +" has just updated the results.");
          })
          .error(function (data, status, header, config) {
            $mdToast.show($mdToast.simple().textContent("Whoops! Something went wrong... it'll be John's fault!  " +status).position("top left").hideDelay(3000));
          });
      }


    }

  self.viewUser = function(username) {
    for(q=0;q<self.players.length;q++) {
      if(self.players[q].username == username) {
        self.displayedUser = self.players[q];
      }
    }
    //self.displayedUser = player;
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
