

function sidenavController($scope, authSvc, properties) {
  var ctrl = this;
  ctrl.auth = authSvc;
  ctrl.properties = properties;

  console.log(JSON.stringify(properties.selectedTeam));

}

angular.module('myApp').component('sidenav', {
  templateUrl: 'components/sidenav.html',
  controller: sidenavController
});
