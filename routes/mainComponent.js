App.controller('mainController', function($scope, $http, $cookies, authSvc, properties, hashService, messageService) {
    authSvc.setView("no_chat");
    var self = this;
    self.auth = authSvc;
    self.properties = properties;
    properties.thisview="main";

    properties.username = $cookies.get("user");
    properties.authrole = $cookies.get("role");
    properties.userId = $cookies.get("id");
    properties.myClub = $cookies.get("myClub");
    properties.myTeam = $cookies.get("myTeam");
    messageService.getMessages( properties.username, properties.alphaClub, properties.alphaTeam);

    var config = {headers : {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'}}
    $http.get("/getCollection?collection=clubs").then(function (response) {
        self.clubs = response.data;
      });

      $http.get("/getCollection?collection=teams").then(function (response) {
          //console.log(JSON.stringify(response.data));
          self.teams = response.data;
        });

    this.setTeam = function(club, team) {
      if(team == undefined ) {
        club=67;
        team=81;
      }
      //console.log("club " + club +" team  " +team +" clublen " +self.clubs.length);
      for(clubcount=0;clubcount<self.clubs.length; clubcount++) {
        if(self.clubs[clubcount].clubId == club) {
          properties.clubId = club;
          properties.clubName = self.clubs[clubcount].clubName;
          properties.alphaClub = hashService.alpha(club);
          properties.selectedClub = self.clubs[clubcount];
        }
      }
      for(teamcount=0;teamcount<self.teams.length; teamcount++) {
        if(self.teams[teamcount].teamId == team) {
          properties.teamId = team;
          properties.teamName = self.teams[teamcount].teamName;
          properties.ageGroup = self.teams[teamcount].ageGroup;
          properties.bg = self.teams[teamcount].bg;
          properties.alphaTeam = hashService.alpha(team);
          properties.selectedTeam = self.teams[teamcount];
          messageService.loginMail();
        }
      }
    };
});
