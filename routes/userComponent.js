

App.controller('userController', function($scope, $http, $mdToast, $location, authSvc, properties, utils) {
  var self = this;
  $scope.authSvc = authSvc;
  authSvc.setView("no_chat");
  self.teams;


    //Fetch all of the users
    $http.get("/getUsers?club=" +properties.alphaClub +"&team=" +properties.alphaTeam).then(function (response) {
        self.users = response.data;
        console.log(self.users.length);

        $http.get("/getCollection?collection=teams").then(function (response) {
            self.teams = response.data;
            console.log("lllddd " +self.teams);
          });

          $http.get("/getCollection?collection=clubs").then(function (response) {
              self.clubs = response.data;
            });

        //if user
        if(authSvc.isAuthenticated) {
          for (i=0;i<self.users.length;i++) {
            if(authSvc.getUserid() == self.users[i].userid) {
              self.user = self.users[i];
            }
          }
        } else {
          $http.get("../data/user.json").then(function (response) {
              self.user = response.data;
            });
        }
      });


    self.save = function(dataUrl, picfile){
        if(picfile == undefined) {
          self.user.avatarUploaded=false;
        } else {
          self.user.avatarUploaded=true;
        }
        var data = JSON.stringify(self.user);
        $http.defaults.headers.post["Content-Type"] = "application/json";
        $http.post("/addUser?club=" +properties.alphaClub +"&team=" +properties.alphaTeam, data).success(function (data, status, headers, config) {

        /*  $http.get("/updateTeamMember?team=" +data.team +"&userid=" +data.userid).success(function (team, status, headers, config) {
            })
            .error(function (data, status, header, config) {
              alert(status);
            });*/

         //Update the selected team to add the user id as a member.
         //console.log(" 1 << " +data.team);
         //console.log(" >> 2 >>"+self.teams);
         //theteam = self.teams[utils.posInArray(self.teams, data.team)];

         for(h=0;h<self.teams.length;h++){
           if(self.teams[h].teamId == data.team){
             myteam =  self.teams[h];
           }
         }

         console.log(myteam);
          delete myteam["_id"];
          delete myteam["$$hashKey"]
          if(myteam.members == undefined) {myteam.members = [];}
          utils.updateArray(myteam.members, data.userid, true);
          //var team = JSON.stringify(theteam);
          console.log("ST " +JSON.stringify(myteam));
          $http.post("/updateTeam?club=" +properties.alphaClub +"&team=" +properties.alphaTeam, JSON.stringify(myteam)).success(function (team, status, headers, config) {
            })
            .error(function (data, status, header, config) {
              alert(status);
            });


              if(typeof data.username != 'undefined') {
                var imageData = dataURItoBlob(dataUrl);
                var fd = new FormData();
                fd.append('userid', data.userid);
                fd.append('avatar', imageData);

                $http({url: '/uploadPhoto',
                      method: 'POST',
                      data: fd,
                      transformRequest: angular.identity,
                      headers: {'Content-Type': undefined}
                }).success(function(){
                    console.log("Success");
                }).error(function(){
                    console.log("ERROR");
                });

                $location.path("/main/100");

            } else {
              if(data.code == 11000) {
                $mdToast.show($mdToast.simple()
                    .textContent('Sorry, that username has already been taken. Choose another!')
                    .position('top left' )
                    .hideDelay(6000)
                );
              } else {
                alert(data.caused_by)
              }
            }
          }).error(function (data, status, header, config) {
                alert(status);
          });
    };

    self.update = function(dataUrl, picFile){
        //console.log("User Saved:" +JSON.stringify(self.user));
        $http.defaults.headers.post["Content-Type"] = "application/json";
        //remove the ID field as this will fail to update.
        delete self.user["_id"];
        if(picFile != undefined) {
          self.user.avatarUploaded = true;
        }
        var data = JSON.stringify(self.user);
        $http.post("/updateUser?club=" +properties.alphaClub +"&team=" +properties.alphaTeam, data).success(function (data, status, headers, config) {
              if(typeof data.nModified != 1)  {
                if(picFile != undefined) {
                  var imageData = dataURItoBlob(dataUrl);
                  var fd = new FormData();
                  fd.append('userid', self.user.userid);
                  fd.append('avatar', imageData);

                  $http({url: '/uploadPhoto',
                        method: 'POST',
                        data: fd,
                        transformRequest: angular.identity,
                        headers: {'Content-Type': undefined}
                  }).success(function(){
                    $mdToast.show($mdToast.simple()
                        .textContent('Your profile has been updated!')
                        .position('top left' )
                        .hideDelay(3000)
                    );

                      console.log("Success");
                  }).error(function(){
                      console.log("ERROR");
                  });
                } else {
                  $mdToast.show($mdToast.simple()
                      .textContent('Your profile has been updated!')
                      .position('top left' )
                      .hideDelay(3000)
                  );
                }
            } else {
              if(data.code == 11000) {
                $mdToast.show($mdToast.simple()
                    .textContent('Sorry, that username has already been taken. Choose another!')
                    .position('top left' )
                    .hideDelay(6000)
                );
              } else {
                console.log("Error in updating image");
                $mdToast.show($mdToast.simple()
                    .textContent('An Error occured in updating the user. Plesae contact your Teamapp Administrator.')
                    .position('top left' )
                    .hideDelay(3000)
                );
              }
            }
          }).error(function (data, status, header, config) {
                alert(status);
          });
    };

    self.upload = function (dataUrl) {
      var imageData = dataURItoBlob(dataUrl);//new Blob([new Uint8Array(dataArray)], {type: mimeString});
      var fd = new FormData();
      fd.append('avatar', imageData);

      $http({
        url: '/uploadPhoto',
        method: 'POST',
        data: fd,
        transformRequest: angular.identity,
        headers: {'Content-Type': undefined}
      })
        .success(function(){
          console.log("Success");
        })
        .error(function(){
          console.log("ERROR");
        });
    };



});
