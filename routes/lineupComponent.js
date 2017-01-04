
App.controller('lineupController',function ($scope, $location, $http,  properties, authSvc) {

  var self = this;
  self.game;
  self.properties = properties;
  authSvc.setView("no_chat");

  self.substitutePosition = ['i2','j2','i3','j3','i4','j4','i5','j5','i6','j6','i7','j7','i8','j8','i9','j9','i10','j10','i11','j11','i12','j12','i13','j13','i14','j14'];
  self.notavailablePosition = ['x1','x2','x3','x4','x5','x6','x7','x8','x13','x14','x15','x16','x17','x18','x19','x20'];
  self.availablePosition = ['v1','v2','v3','v4','v5','v6','v7','v8','v9','v10','v11','v12','v13','v14','v15','v16','v17','v18','v19','v20','v21','v22','v23','v24','v25','v26','v27','v28','v29','v30'];
  self.availList = {};
  self.subList = {};
  self.naList = {};
  self.posList = {};


/*self.alpha=["a","b","c","d","e","f","g","h"];
for(x in self.alpha) {
  for(y=1;y<16;y++) {
    console.log('            <div ng-if="!lc.posList.' +self.alpha[x] +y +'" dragula=\'"selectbag"\' id="' +self.alpha[x] +y +'" class="posSelection"></div>');
    console.log('            <div ng-if="lc.posList.' +self.alpha[x] +y +'" dragula=\'"selectbag"\'  id="' +self.alpha[x] +y +'" class="posSelection"><playerdiv id="{{lc.posList.' +self.alpha[x] +y +'.id}}" squadno="{{lc.posList.' +self.alpha[x] +y +'.squadNo}}" player="{{lc.posList.' +self.alpha[x] +y +'.player}}"/></div>');

  }
  console.log(" ");
}*/

  // get the game id from the url string
  //console.log($location.search().gameId);

  // get the fixture object from the fixtutres already stored in properties
  for(fx=0;fx<self.properties.fixtures.length;fx++){
    if(self.properties.fixtures[fx].id == $location.search().gameId) {
      self.game=self.properties.fixtures[fx];
      break;
    }
  }

  // if players not already in properties get them
  //console.log(" players " +JSON.stringify(properties.players));
  //if(properties.players == undefined || properties.players.length<=0) {
    //console.log("getting players " +properties);
    var config = {headers : {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'}}
    $http.get("/getPlayers?club=" +self.properties.alphaClub +"&team=" +self.properties.alphaTeam).then(function (response) {
        self.properties.players = response.data;

        var subcount=0;
        var notavailcount=0;
        var availcount=0;

        //update the fixture
        for( player in self.properties.players) {

          for(av in self.game.availability) {
            if(self.game.availability[av].id == self.properties.players[player].IDNumber) {
              //console.log(self.game.availability[av]);
              self.game.availability[av].player = self.properties.players[player].Player;
              self.game.availability[av].squadNo = self.properties.players[player].SquadNo;
              //console.log(self.game.availability[av].id +" " +self.game.availability[av].player +" " +self.game.availability[av].squadNo);
              if(self.game.availability[av].selecter == undefined || self.game.availability[av].selecter[0] == 'v' || self.game.availability[av].selecter[0] == 'i' || self.game.availability[av].selecter[0] == 'j' || self.game.availability[av].selecter[0] == 'x' ) {
                  //set the selector based on the availability.
                  switch(self.game.availability[av].available) {
                    case 'C':
                      self.game.availability[av].selecter = self.availablePosition[availcount];
                      self.availList[self.game.availability[av].selecter] = self.game.availability[av];
                      availcount++;
                      break;
                    case 'A':
                      self.game.availability[av].selecter = self.availablePosition[availcount];
                      self.availList[self.game.availability[av].selecter] = self.game.availability[av];
                      availcount++;
                      break;
                    case 'S':
                      self.game.availability[av].selecter = self.substitutePosition[subcount];
                      self.subList[self.game.availability[av].selecter] = self.game.availability[av];
                      subcount++;
                      break;
                    case 'P':
                      self.game.availability[av].selecter = self.substitutePosition[subcount];
                      self.subList[self.game.availability[av].selecter] = self.game.availability[av];
                      subcount++;
                      break;
                    case '£':
                      self.game.availability[av].selecter = self.substitutePosition[subcount];
                      self.subList[self.game.availability[av].selecter] = self.game.availability[av];
                      subcount++;
                      break;
                    case 'N':
                      self.game.availability[av].selecter = self.notavailablePosition[notavailcount];
                      self.naList[self.game.availability[av].selecter] = self.game.availability[av];
                      notavailcount++;
                      break;
                    case 'I':
                      self.game.availability[av].selecter = self.notavailablePosition[notavailcount];
                      self.naList[self.game.availability[av].selecter] = self.game.availability[av];
                      notavailcount++;
                      break;
                    case 'X':
                      self.game.availability[av].selecter = self.notavailablePosition[notavailcount];
                      self.naList[self.game.availability[av].selecter] = self.game.availability[av];
                      notavailcount++;
                      break;
                  }

                } else if(self.game.availability[av].selecter != undefined  ) {
                    //set the selector based on the availability.
                    switch(self.game.availability[av].available) {
                      case 'S':
                        self.posList[self.game.availability[av].selecter] = self.game.availability[av];
                        subcount++;
                        break;
                      case 'P':
                        self.posList[self.game.availability[av].selecter] = self.game.availability[av];
                        subcount++;
                        break;
                      case '£':
                        self.posList[self.game.availability[av].selecter] = self.game.availability[av];
                        subcount++;
                        break;
                    }
                }
            }
          }
        }
    });
  //}

  self.updateSelection = function(fixture) {
    //console.log("Updating seletion.");
    delete fixture["_id"];
    var data= JSON.stringify(fixture);
    //fixture.DATETIME = new Date("2020-09-10T10:30:00.000Z");
    $http.defaults.headers.post["Content-Type"] = "application/json";
    $http.post("/updateFixture?club=" +properties.alphaClub +"&team=" +properties.alphaTeam, fixture).success(function (fixture, status, headers, config) {
        })
        .error(function (data, status, header, config) {
          alert(status);
        });
  };

    $scope.$on('bag-a1.over', function (e, el) {
      el.addClass('over');
      //console.log("OVER - " +el +" - " +e);
    });

    $scope.$on('selectbag.drop', function (e, el, target, source, sibling) {
      el.addClass('ex-moved');
      //console.log("DROPPED " +target[0].firstChild.id  +" TO - " +target[0].id);
      //set the selecter attribute of that player in the current game
      for(x in self.game.availability) {
          if(self.game.availability[x].id == target[0].firstChild.id) {
            self.game.availability[x].selecter=target[0].id;
            break;
          }
      }
    });



});
