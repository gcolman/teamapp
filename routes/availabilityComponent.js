

App.controller('availabilityController', function ($scope, $http, authSvc, properties) {
  var self = this;
  self.playerID = {};
  self.availstyle;
  self.authSvc = authSvc;
  authSvc.setView("no_chat");

    //Fetch all of the games
    var config = {headers : {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'}}
    $http.get("/getFixtures?club=" +properties.alphaClub +"&team=" +properties.alphaTeam).then(function (response) {
        self.games = response.data;
        self.monthx = 'NONE';
      });

    //Fetch all of the players
    $http.get("/getPlayers?club=" +properties.alphaClub +"&team=" +properties.alphaTeam).then(function (response) {
        self.players = response.data;
      });

    //On clisking, update the availability entry for that player.
    self.toggleAvilability = function(player, game) {

      if(game.locked == undefined || !game.locked ) {
        var avail;
          //get the availability entry
          for(gav=0;gav<game.availability.length;gav++) {
            if(game.availability[gav] != undefined && game.availability[gav].id == player) {
              avail = game.availability[gav];
              break;
            }
          }

          console.log("clicked " +player +" " +avail.id);
          if(avail.available =="C") {
            avail.available  = "N";
            this.availstyle="styleNAvail";
          } else if (avail.available =="N") {
            avail.available ="A";
            this.availstyle="styleAvail";
          } else if (avail.available =="A") {
            avail.available ="S";
            this.availstyle="styleSelected";
          } else if (avail.available =="S") {
            avail.available ="P";
            this.availstyle="stylePlayed";
          } else if (avail.available =="P") {
            avail.available ="£";
            this.availstyle="styleNoshow";
          } else if (avail.available =="£") {
            avail.available ="X";
            this.availstyle="styleNoshow";
          } else if (avail.available =="X") {
            avail.available ="I";
            this.availstyle="styleInjured";
          } else if (avail.available =="I") {
            avail.available ="C";
            this.availstyle="styleClear";
          }
          this.updateFixture(game);
          return  avail.available;
        }
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
      $http.post("/updateFixture?club=" +properties.alphaClub +"&team=" +properties.alphaTeam, fixture).success(function (fixture, status, headers, config) {

          })
          .error(function (data, status, header, config) {
            alert(status);
          });
    };

   self.x = function(game){
     console.log("Clicker " +game.locked);
   }

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
