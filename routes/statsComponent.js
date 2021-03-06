

//function newsController($scope, $http, ngDialog, authService, $filter, authSvc) {
App.controller('statsController', function ($scope, $http, authSvc, properties) {
  self = this;
  self.properties = properties;
  self.payed;
  self.refFee;
  self.matchFee;
  self.otherFee;
  self.otherReason;
  self.totalCash;
  self.scgames;
  self.appsData=[];
  self.goalsData=[];
  self.availData=[];
  self.availPlayedData=[];
  self.assistsData=[];
  self.goalDenyData=[];
  self.totalWinsData=[];
  self.seasonstats = {};

  authSvc.setView("no_chat");

  var config = {headers : {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'}}
  $http.get("/getFixtures?club=" +properties.alphaClub +"&team=" +properties.alphaTeam).then(function (response) {
    self.totalWinsData.length=0;
    self.scfixtures = response.data;
    self.seasonstats.totalgames=0;
    self.seasonstats.totalwon=0;
    self.seasonstats.totallost=0;
    self.seasonstats.totaldrawn=0;
    self.seasonstats.totalhome=0;
    self.seasonstats.homewon=0;
    self.seasonstats.homelost =0;
    self.seasonstats.totalaway=0;
    self.seasonstats.awaywon=0;
    self.seasonstats.awaylost=0;
    self.seasonstats.wwld="";

    for(scfCount=0;scfCount<self.scfixtures.length;scfCount++ ) {
        game = self.scfixtures[scfCount];
        if(game.HOMESCORE != undefined && game.HOMESCORE != "-") {
          self.seasonstats.totalgames ++;
          if(game.HOMEAWAY == "Home") {
            self.seasonstats.totalhome ++;
            if(Number(game.HOMESCORE) > Number(game.AWAYSCORE)) {
              self.seasonstats.totalwon ++;
              self.seasonstats.homewon ++;
              self.seasonstats.wwld = self.seasonstats.wwld + "W";
            } else {
              self.seasonstats.totallost++;
              self.seasonstats.homelost ++;
              self.seasonstats.wwld = self.seasonstats.wwld + "L";
            }
          } else {
            self.seasonstats.totalaway ++;
            if(Number(game.AWAYSCORE) > Number(game.HOMESCORE)) {
              self.seasonstats.totalwon ++;
              self.seasonstats.awaywon ++;
              self.seasonstats.wwld = self.seasonstats.wwld + "W";
            } else {
              self.seasonstats.totallost++;
              self.seasonstats.awaylost ++;
              self.seasonstats.wwld = self.seasonstats.wwld + "L";
            }
          }
        }

        self.seasonstats.winpercent = (100 / self.seasonstats.totalgames ) * self.seasonstats.totalwon;
        self.seasonstats.lostpercent = (100 / self.seasonstats.totalgames ) * self.seasonstats.totallost;
        self.seasonstats.drawpercent = (100 / self.seasonstats.totalgames ) * self.seasonstats.totaldrawn;
        self.seasonstats.homewinpercent = (100 / self.seasonstats.totalhome ) * self.seasonstats.homewon;
        self.seasonstats.awaywinpercent = (100 / self.seasonstats.totalaway ) * self.seasonstats.awaywon;
    }

    //Add graph row for goals
    var wins = {};
    var losses = {};
    wins.c = [{v:"Won"},{v:self.seasonstats.totalwon}];
    self.totalWinsData.push(wins);
    losses.c = [{v:"Lost"},{v:self.seasonstats.totallost}];
    self.totalWinsData.push(losses);
    $scope.totalWinsPieObject = createChart("PieChart", "Total Wins", "Played", "Won", self.totalWinsData);

  });

  var createChart = function(chartType, chartTitle, label1, label2, data){
    var chartObject = {};
    chartObject.type = chartType;
    chartObject.data = {"cols": [
        {id: "t", label: label1, type: "string"},
        {id: "s", label: label2, type: "number"},
    ], "rows": data
    };
    chartObject.options = {
        'title': chartTitle
    };
    return chartObject;

  }


    var config = {headers : {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'}}
    $http.get("/getPlayersWithStats?club=" +properties.alphaClub +"&team=" +properties.alphaTeam).then(function (response) {
      self.scplayers = response.data;      
      self.appsData.length=0;
      self.goalsData.length=0;
      self.availData.length=0;
      self.availPlayedData.length=0;

      playersArray = [];
      goalsArray = [];
      appearancesArray = [];
      availableArray = [];

      for(scplayersCount=0;scplayersCount<self.scplayers.length;scplayersCount++ ) {
        playersArray[scplayersCount] = self.scplayers[scplayersCount].Player;
        goalsArray[scplayersCount] = self.scplayers[scplayersCount].gameStats.Goals;
        appearancesArray[scplayersCount] = self.scplayers[scplayersCount].gameStats.Played;
        availableArray[scplayersCount] = self.scplayers[scplayersCount].gameStats.available;

        //Add graph row for appearances
        var apps = {};
        apps.c = [{v:self.scplayers[scplayersCount].Player},{v:self.scplayers[scplayersCount].gameStats.Played}];
        self.appsData.push(apps);

        //Add graph row for goals
        var goals = {};
        goals.c = [{v:self.scplayers[scplayersCount].Player},{v:self.scplayers[scplayersCount].gameStats.Goals}];
        self.goalsData.push(goals);

        //Add graph row for total number of times a player has been available for selection
        var avail = {};
        avail.c = [{v:self.scplayers[scplayersCount].Player},{v:self.scplayers[scplayersCount].gameStats.Available}];
        self.availData.push(avail);

        //Add graph for the percentage of
        var availPlayed = {};
        availPlayed.c = [{v:self.scplayers[scplayersCount].Player},{v:((100/self.scplayers[scplayersCount].gameStats.Available)*self.scplayers[scplayersCount].gameStats.Played)}];
        self.availPlayedData.push(availPlayed);


      }

      $scope.appsChartObject = createChart("BarChart", "Game Appearances", "Player", "Appearances", self.appsData);
      $scope.goalsChartObject = createChart("BarChart", "Goalscorers", "Player", "Goals", self.goalsData);
      $scope.availChartObject = createChart("BarChart", "Games Available for Selection", "Player", "Games Available", self.availData);
      $scope.availPlayedChartObject = createChart("BarChart", "Percentage of games played when player available", "Player", "% played when available", self.availPlayedData);



    });

    self.updateFixture = function(fixture) {
      delete fixture["_id"];
      var data= JSON.stringify(fixture);
      //console.log(data);
      $http.defaults.headers.post["Content-Type"] = "application/json";
      $http.post("/updateFixture?club=" +properties.alphaClub  +"&team=" +properties.alphaTeam, fixture).success(function (fixture, status, headers, config) {
          })
          .error(function (data, status, header, config) {
            alert(status);
          });
        };
});
