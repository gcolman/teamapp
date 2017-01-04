

function topnavController($scope, properties, messageService, authSvc) {
var ctrl = this;
ctrl.properties = properties;
ctrl.messageService = messageService;

var clubname = properties.clubName;

  var originatorEv;
  this.openMenu = function($mdOpenMenu, ev) {
    console.log("open");
    originatorEv = ev;
    $mdOpenMenu(ev);
  };

  ctrl.formatDate = function(date) {
    d = new Date(date);
    return d.getDate() +"/" +d.getMonth() +" " +d.getHours() +":" +d.getMinutes();
  };

  ctrl.logout = function() {
    console.log("LOGOUT");
    authSvc.logout();
    messageService.logoutMail();
  };

  ctrl.removeMessage = function(id) {
    messageService.sendMsg("REMOVE="+id);
    $http.get("/removeMessage?id=" +id +"&club=" +properties.alphaClub +"&team=" +properties.alphaTeam).then(function (response) {
        console.log("removing message " +id);

      });
  };



}

angular.module('myApp').component('topnav', {
  templateUrl: 'components/topnav.html',
  controller: topnavController
});
