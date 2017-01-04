function onlineController($scope, $element, $attrs, $http, properties) {
  var ctrl = this;

  var config = {headers : {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'}}
  $http.get("/getUsers?club=" +properties.alphaClub +"&team=" +properties.alphaTeam).then(function (response) {
      ctrl.users = response.data;
    });

}

angular.module('myApp').component('online', {
  templateUrl: 'components/online.html',
  controller: onlineController
});
