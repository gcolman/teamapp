Var App = angular.module('wsapp', ['ngWebSocket'])

  App.factory('MyData', function($websocket) {
     // Open a WebSocket connection
     var dataStream = $websocket('ws://graeme.com:8001');
     var collection = [];

     dataStream.onMessage(function(message) {
       collection.push(JSON.parse(message.data));
     });

     var methods = {
       collection: collection,
       get: function() {
         dataStream.send(JSON.stringify({ action: 'get' }));
       }
     };

     return methods;
   })

   App.controller('wsCtl', function ($scope, MyData) {
     $scope.MyData = MyData;
   });
