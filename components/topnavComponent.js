

function topnavController($scope, $mdDialog, properties, messageService, authSvc) {
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

  ctrl.showHelp = function(ev) {
    $mdDialog.show({
      controller: DialogController,
      templateUrl: '/components/help.html',
      parent: angular.element(document.body),
      targetEvent: ev,
      clickOutsideToClose:true
    })
        .then(function(answer) {
          $scope.status = 'You said the information was "' + answer + '".';
        }, function() {
          $scope.status = 'You cancelled the dialog.';
        });
  };
}


  function DialogController($scope, $mdDialog) {
    $scope.hide = function() {
      $mdDialog.hide();
    };

    $scope.cancel = function() {
      $mdDialog.cancel();
    };

    $scope.answer = function(answer) {
      $mdDialog.hide(answer);
    };
  }

angular.module('myApp').component('topnav', {
  templateUrl: 'components/topnav.html',
  controller: topnavController
});
