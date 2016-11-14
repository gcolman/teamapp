function chatController($scope, $element, $attrs, $http, $filter, authSvc, chatService) {
  var ctrl = this;
  $scope.authSvc = authSvc;

  var config = {headers : {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'}}
  $http.get("/getUsers").then(function (response) {
      ctrl.users = response.data;
    });

    ctrl.sendChat = function(msg) {
        user=authSvc.getUsername();
        time=$filter('date')(new Date(), "EEE' 'H:m");
        msg=user+','+time+','+msg;
        chatService.get(msg);
    };

}

angular.module('myApp').component('chat', {
  templateUrl: 'components/chat.html',
  controller: chatController
});
