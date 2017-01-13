

//function newsController($scope, $http, ngDialog, authService, $filter, authSvc) {
App.controller('newsController', function ($scope, $http, ngDialog, authService, $filter, authSvc, properties ) {
  var self = this;
  self.authSvc = authSvc;
  this.authenticated = authSvc.isAuthenticated();
  count=0;
  self.properties = properties;
  authSvc.setView("news_view");


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

});
