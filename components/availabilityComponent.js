

function availabilityController($scope, $http) {
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



}

angular.module('myApp').component('availability', {
  templateUrl: 'components/availabilityComponent.html',
  controller: availabilityController
});
