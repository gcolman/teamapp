

function topnavController() {


  var originatorEv;
  this.openMenu = function($mdOpenMenu, ev) {
    console.log("open");
    originatorEv = ev;
    $mdOpenMenu(ev);
  };
  
}

angular.module('myApp').component('topnav', {
  templateUrl: 'components/topnav.html',
  controller: topnavController
});
