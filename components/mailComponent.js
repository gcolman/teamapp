
function mailController($scope, authSvc, $http, messageService, properties) {
  var ctrl = this;
  $scope.messageService = messageService;


  ctrl.formatDate = function(date) {
    d = new Date(date);
    return d.getDate() +"/" +d.getMonth() +" " +d.getHours() +":" +d.getMinutes();
  };

  ctrl.removeMessage = function(id) {
    messageService.sendMsg("REMOVE="+id);
    $http.get("/removeMessage?id=" +id +"&club=" +properties.alphaClub +"&team=" +properties.alphaTeam).then(function (response) {
        console.log("removing message " +id);

      });
  };
}

angular.module('myApp').component('mail', {
  templateUrl: 'components/mailComponent.html',
  controller: mailController
});
