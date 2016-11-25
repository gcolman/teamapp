

function mailController($scope, authSvc, $http, messageService) {
  var ctrl = this;
  $scope.messageService = messageService;

  /*$http.get("/getMessages?to=" +authSvc.getUsername()).then(function (response) {
      ctrl.messages = response.data;
    });
*/
  ctrl.formatDate = function(date) {
    d = new Date(date);
    return d.getDate() +"/" +d.getMonth() +" " +d.getHours() +":" +d.getMinutes();
  };

  ctrl.removeMessage = function(id) {
    messageService.sendMsg("REMOVE="+id);
    $http.get("/removeMessage?id=" +id).then(function (response) {
        console.log("removing message " +id);

      });
  };

}

angular.module('myApp').component('mail', {
  templateUrl: 'components/mailComponent.html',
  controller: mailController
});
