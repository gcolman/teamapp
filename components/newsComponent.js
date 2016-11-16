

function newsController($scope, $http, ngDialog, chatService, authService, $filter, authSvc) {

  var self = this;
  $scope.authSvc = authSvc;
  this.authenticated = authSvc.isAuthenticated();
  count=0;

  $scope.$on('auth', function (event, data) {
    if(data =="login") {
      self.authenticated=true;
    }else if(data=="logout"){
      self.authenticated=false;
    }
  });


  var config = {headers : {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'}}
  $http.get("/getNews").then(function (response) {
      self.news = response.data;
    });


  self.edit = function(news) {
    ngDialog.open({ template: '../newsEditDialog.html', className: 'ngdialog-theme-default', data: news , showClose: false});
  };


  self.updateNews = function(news) {
    delete news["_id"];
    var data= JSON.stringify(news);
    console.log(data);
    $http.defaults.headers.post["Content-Type"] = "application/json";
      $http.post("/updateNews", data).success(function (data, status, headers, config) {
          ngDialog.close();
        })
        .error(function (data, status, header, config) {
          alert(status);
        });
  };
}

angular.module('myApp').component('news', {
  templateUrl: 'components/news.html',
  controller: newsController
});
