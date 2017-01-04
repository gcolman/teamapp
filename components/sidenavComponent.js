

function sidenavController($scope, authSvc) {
  var ctrl = this;
  ctrl.auth = authSvc;

}

angular.module('myApp').component('sidenav', {
  templateUrl: 'components/sidenav.html',
  controller: sidenavController
});
