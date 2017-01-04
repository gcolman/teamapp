

//function newsController($scope, $http, ngDialog, authService, $filter, authSvc) {
App.controller('adminController', function ($scope, $http, authSvc, properties) {
  self = this;
  self.properties = properties;
  self.acgames;
  self.cashBalance=0;
  authSvc.setView("no_chat");


  //var getUsers = function() {
    var userlist="[" +properties.selectedTeam.members +"]";
/*    for(ddd in properties.selectedTeam.members){
      console.log(ddd);
      console.log(ddd.userid);
      userlist = userlist +ddd.userid +","
    }
    userlist = userlist + "000]";
*/
    instring = '{"userid" : {"$in" : [' +properties.selectedTeam.members +'] }}'

    var config = {headers : {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'}}
    $http.get("/getInCollection?collection=users&instring=" +instring).then(function (response) {
        self.memberlist = response.data;
      });

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
          console.log(self.cashBalance +" -  " +self.totalCash +" xx "    +  properties.selectedTeam.banking[x].bankedAmount);
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
