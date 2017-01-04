function chatController($scope, $element, $attrs, $http, $filter, authSvc, messageService, properties) {
  var ctrl = this;
  $scope.authSvc = authSvc;
  $scope.messageService = messageService;

  var config = {headers : {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'}}
  $http.get("/getUsers?club=" +properties.alphaClub +"&team=" +properties.alphaTeam).then(function (response) {
      ctrl.users = response.data;
    });

    ctrl.sendChat = function(msg) {
      if(msg.substr(0,1)=="@") {
          //send a private messages
          to=msg.substr(1,(msg.indexOf(" ") -1));
          msgbody=msg.substr(msg.indexOf(" ")+1);
          fullmsg='{"to":"' +to +'","from":"' +authSvc.getUsername() +'","body":"' +msgbody +'","status": "unread"'  +',"date":"' +new Date() +'"}';
          $http.post("/addMessage?club=" +properties.alphaClub +"&team=" +properties.alphaTeam, fullmsg).success(function (data, status, headers, config) {
            //console.log("COMING BACK " +JSON.stringify(data));
              messageService.sendMsg(data);
          })
          .error(function (data, status, header, config) {
            alert(status);
          });
      } else {
        user=authSvc.getUsername();
        time=$filter('date')(new Date(), "EEE' 'H:m");
        msg=properties.alphaClub +properties.alphaTeam +',' +user+','+time+','+msg;
        //msg=user+','+time+','+msg;
        messageService.sendMsg(msg);
      }
    };

}

angular.module('myApp').component('chat', {
  templateUrl: 'components/chat.html',
  controller: chatController
});
