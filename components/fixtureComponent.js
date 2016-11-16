

function fixtureController($scope, $http, ngDialog, textAngularManager, authService) {

  var self = this;
  var showme = [];
  var month = "NONE";
  self.showmonth;
  self.showReport = {};
  self.fixID = {};


  var config = {headers : {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'}}
  $http.get("/getFixtures").then(function (response) {
      self.games = response.data;
    });

    // set the default value of our number
    $scope.myNumber = 0;

    // function to evaluate if a number is even
    $scope.isEven = function(value) {

    if (value % 2 == 0)
      return true;
    else
      return false;

    };


    self.showMonth = function(newmonth) {
      if(newmonth != month) {
        month = newmonth;
        return  true;
      } else {
        return  false;
      }
    };

    self.reset = function() {
    console.log(count++);
    };

    self.isAuthenticated = function() {
      return authService.isAuthenticated();
    };

    self.updateFixture = function(fixture) {
      delete fixture["_id"];
      //console.log(fixture.DATETIME);
      var data= JSON.stringify(fixture);
      //fixture.DATETIME = new Date("2020-09-10T10:30:00.000Z");
      $http.defaults.headers.post["Content-Type"] = "application/json";
      $http.post("/updateFixture", fixture).success(function (fixture, status, headers, config) {

          })
          .error(function (data, status, header, config) {
            alert(status);
          });
    };

    self.openFixtureEdit = function (x) {
      console.log("edit fixture");
        ngDialog.open({ template: '../fixtureEdit.html', className: 'ngdialog-theme-default', data: x , showClose: false});
    };


    self.showreport = function (id) {
      //console.log("ID=" +this.showReport[id]);
        //if(this.showReport[id] === null || this.showReport[id] === undefined) {
          self.showReport[id] = true;
        //} else {
        //  this.showReport[id] = !this.showReport[id]
        //}
    };


}

angular.module('myApp').component('fixtures', {
  templateUrl: 'components/fixtureComponent.html',
  controller: fixtureController
});
