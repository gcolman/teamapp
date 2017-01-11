

//function newsController($scope, $http, ngDialog, authService, $filter, authSvc) {
App.controller('adminController', function ($scope, $http, authSvc, properties) {
  self = this;
  self.properties = properties;
  self.acgames;
  self.cashBalance=0;
  self.members=[];
  self.players;
  self.memberlist;
  authSvc.setView("no_chat");


  //if the properties does not have player list get one
  //console.log("lengtho fo players "+properties.players.);
    //if(properties.players == undefined || properties.players[0] == undefined {
      //console.log("No players... getting again...");
      $http.defaults.headers.post["Content-Type"] = "application/json";
      $http.get("/getPlayersWithStats?club=" +properties.alphaClub +"&team=" +properties.alphaTeam).then(function (response) {
          //console.log("mmmmmmmm"+response.data);
          self.players = response.data;
        });
    //}



  //var getUsers = function() {
    var userlist="[" +properties.selectedTeam.members +"]";
    instring = '{"userid" : {"$in" : [' +properties.selectedTeam.members +'] }}'
    $http.defaults.headers.post["Content-Type"] = "application/json";
    $http.get("/getInCollection?collection=users&instring=" +instring).then(function (response) {
      //console.log("memberlist = "+JSON.stringify(response.data));
        self.memberlist = response.data;
        self.members.length =0;
        //now update the userslist with some data to display in the edit users tab.
        for(i=0;i<response.data.length;i++) {
          //console.log("RDL" +response.data.length +JSON.stringify(self.members));
          user={};
          user.userid=response.data[i].userid;
          user.firstname = response.data[i].firstname;
          user.surname = response.data[i].surname;
          user.username = response.data[i].username;
          user.players = response.data[i].players;

          // now add the is valid, is coach and is admin flags.
         if(self.isInArray(properties.selectedTeam.administrators, user.userid)) {
            user.isAdmin = true;
          } else {
            user.isAdmin = false;
          }
          // now add the is valid, is coach and is admin flags.
          if(self.isInArray(properties.selectedTeam.coaches, user.userid)) {
            user.isCoach = true;
          } else {
            user.isCoach = false;
          }
          // now add the is valid, is coach and is admin flags.
          if(self.isInArray(properties.selectedTeam.validusers, user.userid)) {
            user.isValid = true;
          } else {
            user.isValid = false;
          }
          //add that user to the list;
          self.members.push(user);
        }
        //console.log(JSON.stringify(self.members));
      });

  self.isInArray = function(array, value) {
    if(array != undefined) {
      for(x=0;x<array.length;x++) {
        if(array[x] == value) {
          return true;
          break;
        }
      }
    }
    return false;
  }

  self.posInArray = function(array, value) {
    if(array != undefined) {
      for(x=0;x<array.length;x++) {
        if(array[x] == value) {
          return x;
          break;
        }
      }
    }
    return -1;
  }

  /**
  * Update an array either add an element or remove the element addme=true/false
  **/
  self.updateArray = function(array, val, addme) {
    change=false;
    pos = self.posInArray(array, val);
    if(addme) {
      if(pos < 0 ) {
        //if not in array then add
        array.push(val);
        change = true;
      }
    } else {
      if(pos >= 0 ) {
        //remove from array
        array.splice(pos, 1);
        change = true;
      }
    }
    return change;
  }

  /**
  * Update a user
  */
  self.updateIndividualUser = function(user) {
    //console.log("UPDATE " +JSON.stringify(user) );
    changed = false;
    // check if either the player or the team memberlists have changed then update either or both.
    changed = changed || self.updateArray(properties.selectedTeam.administrators, user.userid, user.isAdmin);
    changed = changed || self.updateArray(properties.selectedTeam.coaches, user.userid, user.isCoach);
    changed = changed || self.updateArray(properties.selectedTeam.validusers, user.userid, user.isValid);

    if(changed) {
      delete properties.selectedTeam["_id"];
      var data= JSON.stringify(properties.selectedTeam);
      //console.log(data);
      $http.defaults.headers.post["Content-Type"] = "application/json";
      $http.post("/updateTeam?club=" +properties.alphaClub +"&team=" +properties.alphaTeam, properties.selectedTeam).success(function (team, status, headers, config) {
        })
        .error(function (data, status, header, config) {
          alert(status);
        });
      }

      //if the players have changed... update user
      for(m=0;m<self.memberlist.length;m++){
        if(self.memberlist[m].userid == user.userid){
          self.memberlist[m].players = user.players;

          $http.defaults.headers.post["Content-Type"] = "application/json";
          delete self.memberlist[m]["_id"];
          var data = JSON.stringify(self.memberlist[m]);
          $http.post("/updateUser?club=" +properties.alphaClub +"&team=" +properties.alphaTeam, data).success(function (data, status, headers, config) {
          })
          .error(function (data, status, header, config) {
            alert(status);
          });

        }
      }
  }



  //}
  /**
  * Convert a string to a date object
  */
  self.convertToDate = function (stringDate){
    var dateOut = new Date(stringDate);
    dateOut.setDate(dateOut.getDate() + 1);
    return dateOut;
  };

  var config = {headers : {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'}}
  $http.get("/getFixtures?club=" +properties.alphaClub +"&team=" +properties.alphaTeam).then(function (response) {
      self.acgames = response.data;
      self.totalCash = 0;

      //caclculate the stats and add to the games object.
      for(gcount = 0; gcount < self.acgames.length; gcount++) {
        //console.log("1 " +JSON.stringify(self.games));
        thisgame = self.acgames[gcount];
        playedCount = 0;
        for(scpcount=0; scpcount < thisgame.availability.length; scpcount++) {
          if(thisgame.availability[scpcount].available == "P" || thisgame.availability[scpcount].available == "£") {
            playedCount++;
          }
        }
        thisgame.totalPlayed = playedCount;

        payedCount = 0;
        for(scpaycount=0; scpaycount < thisgame.availability.length;scpaycount++) {
          if(thisgame.availability[scpaycount].available == "£") {
            //self.totalCash += self.matchFee;
            payedCount++;
          }
        }
        thisgame.totalPaid = payedCount;

        if(self.acgames[gcount] != "-") {
          //console.log(self.acgames[gcount].matchFee +"+" +self.acgames[gcount].totalPaid +"=" +self.acgames[gcount].matchFee * self.acgames[gcount].totalPaid);
          self.totalCash += (self.acgames[gcount].matchfee * self.acgames[gcount].totalPaid) - self.acgames[gcount].refFee - self.acgames[gcount].otherFee;
        }
      }

      self.cashBalance =self.totalCash;
      // now iterate through banking to get the total cashBalance
      if(properties.selectedTeam.banking != undefined) {
        for(x=0;x<properties.selectedTeam.banking.length;x++) {
          //console.log(self.cashBalance +" -  " +self.totalCash +" xx "    +  properties.selectedTeam.banking[x].bankedAmount);
          self.cashBalance  -= properties.selectedTeam.banking[x].bankedAmount;
        }
      }
    });

    self.updateFixture = function(fixture) {
      delete fixture["_id"];
      var data= JSON.stringify(fixture);
      $http.defaults.headers.post["Content-Type"] = "application/json";
      $http.post("/updateFixture?club=" +properties.alphaClub +"&team=" +properties.alphaTeam, fixture).success(function (fixture, status, headers, config) {
          self.totalCash = 0;
          for(x=0;x<self.acgames.length;x++) {
            self.totalCash += (self.acgames[x].matchfee * self.acgames[x].totalPaid) - self.acgames[x].refFee - self.acgames[x].otherFee;
          }
        })
        .error(function (data, status, header, config) {
          alert(status);
        });
    };

    self.removeBanked = function(index) {
      properties.selectedTeam.banking.splice(index,1);
      self.updateTeam(properties.selectedTeam);
    }

    self.bank = function(date, amount) {
      var banked = {};
      banked.bankedDate = date;
      banked.bankedAmount = amount;
      if(properties.selectedTeam.banking) {
        properties.selectedTeam.banking.push(banked);
      } else {
        properties.selectedTeam.banking = [];
        properties.selectedTeam.banking.push(banked);
      }
      self.updateTeam(properties.selectedTeam);
    };

    self.updateTeam = function(team) {
      delete team["_id"];
      var data= JSON.stringify(team);
      $http.defaults.headers.post["Content-Type"] = "application/json";
      $http.post("/updateTeam?club=" +properties.alphaClub +"&team=" +properties.alphaTeam, team).success(function (team, status, headers, config) {
        self.cashBalance=self.totalCash;
        // now iterate through banking to get the total cashBalance
        for(x=0;x<properties.selectedTeam.banking.length;x++) {
          self.cashBalance -= properties.selectedTeam.banking[x].bankedAmount;
        }
        })
        .error(function (data, status, header, config) {
          alert(status);
        });
    };

    self.updateClub = function(club) {
      delete club["_id"];
      //console.log(fixture.DATETIME);
      var data= JSON.stringify(club);
      //fixture.DATETIME = new Date("2020-09-10T10:30:00.000Z");
      $http.defaults.headers.post["Content-Type"] = "application/json";
      $http.post("/updateClub?club=" +properties.alphaClub +"&team=" +properties.alphaTeam, fixture).success(function (fixture, status, headers, config) {
        })
        .error(function (data, status, header, config) {
          alert(status);
        });
    };

});
