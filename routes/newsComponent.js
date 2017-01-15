

//function newsController($scope, $http, ngDialog, authService, $filter, authSvc) {
App.controller('newsController', function ($scope, $http, ngDialog, authService, $filter, authSvc, properties, utils ) {
  var self = this;
  self.authSvc = authSvc;
  this.authenticated = authSvc.isAuthenticated();
  count=0;
  self.properties = properties;
  authSvc.setView("news_view");

console.log("IS IN TEAM = " +authSvc.isInTeam(properties.selectedTeam));

  $scope.$on('auth', function (event, data) {
    if(data =="login") {
      self.authenticated=true;
    }else if(data=="logout"){
      self.authenticated=false;
    }
  });

  var config = {headers : {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'}}
  $http.get("/getNews?club=" +properties.alphaClub +"&team=" +properties.alphaTeam).then(function (response) {
      self.news = response.data;
    });


  self.edit = function(news) {
    ngDialog.open({ template: '../newsEditDialog.html', className: 'ngdialog-theme-default', data: news , showClose: false});
  };

  self.joinTeam = function() {

    myteam = properties.selectedTeam;

    delete myteam["_id"];
    delete myteam["$$hashKey"]
    if(myteam.members == undefined) {myteam.members = [];}
    utils.updateArray(myteam.members, properties.userid, true);
    //var team = JSON.stringify(theteam);
    console.log("ST " +JSON.stringify(myteam));
    $http.post("/updateTeam?club=" +properties.alphaClub +"&team=" +properties.alphaTeam, JSON.stringify(myteam)).success(function (team, status, headers, config) {
      })
      .error(function (data, status, header, config) {
        alert(status);
      });

  }


});
