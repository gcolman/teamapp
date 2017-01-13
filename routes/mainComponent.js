App.controller('mainController', function($scope, $http, $cookies, $mdToast, $routeParams, authSvc, properties, messageService, utils) {
    authSvc.setView("no_chat");
    var self = this;
    self.auth = authSvc;
    self.properties = properties;
    properties.thisview="main";
    self.msg = $routeParams.msg;

    properties.username = $cookies.get("user");
    properties.authrole = $cookies.get("role");
    properties.userId = $cookies.get("id");
    properties.myClub = $cookies.get("myClub");
    properties.myTeam = $cookies.get("myTeam");
    messageService.getMessages( properties.username, properties.alphaClub, properties.alphaTeam);

    console.log(self.msg);
    if(self.msg != undefined) {
      if(self.msg == 100 ) {
        self.msg = "Congratulations, you have registerd you user. Now you can login with your username and password."
      }
      $mdToast.show($mdToast.simple()
          .textContent(self.msg)
          .position('top left' )
          .hideDelay(6000)
      );
    }

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
          properties.alphaClub = utils.alpha(club);
          properties.selectedClub = self.clubs[clubcount];
        }
      }
      for(teamcount=0;teamcount<self.teams.length; teamcount++) {
        if(self.teams[teamcount].teamId == team) {
          properties.teamId = team;
          properties.teamName = self.teams[teamcount].teamName;
          properties.ageGroup = self.teams[teamcount].ageGroup;
          properties.bg = self.teams[teamcount].bg;
          properties.alphaTeam = utils.alpha(team);
          properties.selectedTeam = self.teams[teamcount];
          messageService.loginMail();
        }
      }
    };
});
