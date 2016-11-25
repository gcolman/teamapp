

function mainController($scope,$http, props) {
  var ctrl = this;
  //this.prop = props;

  console.log("MAINC pr = " +props.clubName);
    props.setClubName("fofofofo");
    console.log("MAINC pr = " +props.clubName);
  var config = {headers : {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'}}
  $http.get("/getCollection?collection=clubs").then(function (response) {
      ctrl.clubs = response.data;
      //props.clubName="fofofofo";
      props.teamId=99;
    });

    $http.get("/getCollection?collection=teams").then(function (response) {
        ctrl.teams = response.data;
      });
}

angular.module('myApp').component('main', {
  templateUrl: 'components/mainComponent.html',
  controller: mainController
});
