var express = require('express');
var app = express();
var fs = require("fs");
var mongodb = require('mongodb');
var MongoClient = require('mongodb').MongoClient , assert = require('assert');
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var jsonParser = bodyParser.json();
var ws = require("nodejs-websocket");
var multer = require('multer')

//var url = 'mongodb://localhost:27017/teamapp';


/*******************************
* Storage for fule uploader
******************************/
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '../images/people')
  },
  filename: function (req, file, cb) {
    cb(null, req.body.userid)
  }
})
var upload = multer({ storage: storage })

/**************************************
* Post photo upload
**************************************/
app.post('/uploadPhoto', upload.single('avatar'), function (req, res, next) {
  res.end();
})


/**************************************
** Websocket
***************************************/
var connections = [];
var chatHistory = [];
var wsserver = ws.createServer(function (conn) {
    console.log("New connection " +chatHistory.length)
    //var connection = request.accept('echo-protocol', request.origin);
    connections.push(conn);
    /*for(i=0;i<chatHistory.length;i++) {
      //console.log("sending " +chatHistory[i] +" to connection ");
      conn.sendText(chatHistory[i]);
      if(i>100) {
        break;
      }
    }*/

    conn.on('error', function (err) {
        if (err.code !== 'ECONNRESET') {
            // Ignore ECONNRESET and re throw anything else
            console.log("There's an ERRCONSET " +err);
            //throw err
        } else {
          console.log("ERROR WITH CHAT : "+err);
        }
    })

    conn.on("text", function (str) {
        // If a new connection then get all of that channel's message history and send through to the channel,
        //checking the clubteam id of the message with the cliubteam sent through in the NEW_CONNECT string
        console.log("NEWCONNECTION");
        if(str.split(',')[0] == "NEW_CONNECT") {
          id=str.split(',')[1];
          x=0;
          for(i=0;i<chatHistory.length;i++) {
            msgid=chatHistory[i].split(',')[0];
            //console.log(id +"==" +msgid);
            if(msgid == id) {
              conn.sendText(chatHistory[i]);
              x++;
              if(x>100) {
                break;
              }
            }
          }
        } else {
          //console.log("Received "+str +" number of connections = " +connections.length)
          //Don't store messages that are not plain chats.
          if(str[0] != "{" && str.substring(0,6) != "REMOVE") {
            chatHistory.push(str);
          }

          // Resend the message to all other listeners
          for(var i = 0; i < connections.length; i++) {
              connections[i].sendText(str);
          }
        }
    })

    conn.on("close", function (code, reason) {
        console.log("Connection closed " +code +" " +reason)
    })
}).listen(8001)

//static pages
//TODO genericise
app.use(express.static('/home/gcolman/private/teamapp'));
//app.use(express.bodyParser());

/**
* Express server
*/
var server = app.listen(80, function () {
   var host = server.address().address
   var port = server.address().port
   console.log("Example app listening at http://%s:%s", host, port)
})

/**
* MongoDB connection pool - uses a single connection.
*/
MongoClient.connect("mongodb://localhost:27017/teamapp", function(err, database) {
  if(err) throw err;
  db = database;
});


/**
* generic get all documents from a collection using the quiery param "collection"
*/
app.get('/getCollection', function (req, res) {
      console.log( "/getCollection : " +req.query.collection );
      findAllDocuments(db, req.query.collection, false,  null, null, function(docs) {
        console.log(JSON.stringify(docs));
        res.end( JSON.stringify(docs) );
      });

})

/**
* generic get all documents from a collection using the quiery param "collection"
*/
app.get('/getInCollection', function (req, res) {
      console.log( "/getInCollection : " +req.query.collection +" IN " +req.query.instring);
      findDocumentsByString(db, req.query.collection,  JSON.parse(req.query.instring), function(docs) {
        res.end( JSON.stringify(docs) );
      });
})

app.post('/updateCollection', jsonParser, function (req, res) {
    console.log("/updateColection: " +req.query.collection +" " +req.query.key +" = " +req.query.id);
      updateDocument(db, req.query.collection, req.query.key, +req.query.id, req.body, function(docs) {
        res.end(JSON.stringify(docs));
    });
})

/**
* Players
*/
app.get('/getPlayers', function (req, res) {
      console.log( "/getPalyers : " +req );
      findAllDocuments(db, req.query.club +"_" +req.query.team +'_players', true,  "SquadNo", "asc", function(docs) {
        res.end( JSON.stringify(docs) );
      });

})

app.get('/getPlayersWithStats', function (req, res) {
      console.log( "/getPalyers : " +req );
      findAllDocuments(db, req.query.club +"_" +req.query.team +'_players', true,  "SquadNo", "1", function(docs) {
        var stats = getAllStats(function(stats){
          docs.forEach(function(player) {
              //add the stat to the player.
              player["gameStats"] = stats[player.IDNumber];
          });
            res.end( JSON.stringify(docs) );
        }, req, res);
      });

})

app.get('/getPlayer', function (req, res) {
      console.log( "/getPlayer : " +req.query.id );
      findDocumentsByID(db, req.query.club +"_" +req.query.team +'_players', 'IDNumber', +req.query.id, function(docs) {
        //console.log(JSON.stringify(docs) );
        res.end(docs);
      });
})

app.get('/removePlayer', function (req, res) {
      console.log( "/removePlayer : " +req );
      removeDocument(db, req.query.club +"_" +req.query.team +'_players', 'IDNumber', +req.query.id, function(docs) {
        //console.log(JSON.stringify(docs) );
        res.end(docs);
    });
      res.end( "xxxxx" );
})

app.post('/updatePlayer', jsonParser, function (req, res) {
      console.log("Updaterere" +JSON.stringify(req.body));
      updateDocument(db, req.query.club +"_" +req.query.team +'_players', 'IDNumber', +req.body.IDNumber, req.body, function(docs) {
        res.end(JSON.stringify(docs));
      //res.end(docs);
    });
})

app.post('/addPlayer', jsonParser, function (req, res) {
  getNextSeq("userid", function(id) {
    req.body.userid=id;
       addDocument(db, req.query.club +"_" +req.query.team +'_players', req.body, function(docs,err) {
          if(err) {
              console.log("ERROR IN addPlayer");
          }
          res.end(JSON.stringify(docs));
      });
  });
})



app.get('/getStats', function (req, res) {
      console.log( "/getStats : " +req.query.id );
      findAllDocuments(db, 'stats', false, null, null, function(docs) {
        //console.log(JSON.stringify        res.end(docs);
      });
})

app.get('/getStat', function (req, res) {
      console.log( "/getStat : " +req.query.id );
      findDocumentsByID(db, 'stats', 'IDNumber', +req.query.id, function(docs) {
        //console.log(JSON.stringify(docs) );
        res.end(docs);
      });
})

app.get('/updataStat', function (req, res) {
      console.log( "/addStats : " +req );
      updateDocument(db, 'stats', 'IDNumber', +req.body.IDNumber, req.body, function(docs) {
        res.end(JSON.stringify(docs));
      });
})


app.get('/getAllStats', function (req, res) {
      console.log( "/getAllStats : " +req );
      res.end( JSON.stringify(getAllStats(req, res)) );
})


/*var getTeamStats= function(cb, req, res) {
    console.log("/getTeamStats");
    var teamstats={};
    teamstats.totalgames=0;
    teamstats.totalwon=0;
    teamstats.totaldrawn=0;
    teamstats.totallost=0;
    teamstats.gameseq="";


    //get all fixtures
    findAllDocuments(db, req.query.club +"_" +req.query.team +'_fixtures', true,  DATE, 1, function(fixtures) {
        fixtures.forEach(function(fix){
          if(fix.HOMESCORE != '-') {
            if(fix.HOMETEAM == properties.myTeam)
          }

        });
        //console.log(stats);
        cb(teamstats);
        return stats;
    });
}*/

var getAllStats= function(cb, req, res) {
    console.log("/getAllStats");
    var stats={};
    //get all fixtures
    findAllDocuments(db, req.query.club +"_" +req.query.team +'_fixtures', false,  null, null, function(fixtures) {
        fixtures.forEach(function(fix){
          //console.log(fix.SCORERS);
            for(i=0; i<fix.availability.length; i++) {
              var stat = {};
              if(fix.availability[i].id != undefined) {
                if(stats[fix.availability[i].id] == undefined) {
                  // need to add a stat entry
                  stat.IDNumber=fix.availability[i].id;
                  stat.Available = 0;
                  stat.Played = 0;
                  stat.NotAvailable = 0;
                  stat.Injured = 0;
                  stat.NoPlay = 0;
                  stat.NoAnswer = 0;
                  stat.Goals = 0;
                  stat.Paid = 0;
                  stat.Selected = 0;
                  stats[fix.availability[i].id] = stat;
                } else {
                  stat = stats[stats[fix.availability[i].id]]
                }

                // So add the stat.
                if(fix.availability[i].available == "A") {
                  stats[fix.availability[i].id].Available = ++stats[fix.availability[i].id].Available ;
                } else if(fix.availability[i].available == "P") {
                  stats[fix.availability[i].id].Played = ++stats[fix.availability[i].id].Played;
                  stats[fix.availability[i].id].Available = ++stats[fix.availability[i].id].Available ;
                } else if(fix.availability[i].available == "N") {
                  stats[fix.availability[i].id].NotAvailable = ++stats[fix.availability[i].id].NotAvailable ;
                } else if(fix.availability[i].available == "I") {
                  stats[fix.availability[i].id].Injured = ++stats[fix.availability[i].id].injured ;
                } else if(fix.availability[i].available == "X") {
                  stats[fix.availability[i].id].NoPlay = ++stats[fix.availability[i].id].NoPlay ;
                } else if(fix.availability[i].available == "C") {
                  stats[fix.availability[i].id].NoAnswer = ++stats[fix.availability[i].id].NoAnswer ;
                } else if(fix.availability[i].available == "£") {
                  stats[fix.availability[i].id].Paid = ++stats[fix.availability[i].id].Paid ;
                  stats[fix.availability[i].id].Available = ++stats[fix.availability[i].id].Available ;
                  stats[fix.availability[i].id].Played = ++stats[fix.availability[i].id].Played;
                } else if(fix.availability[i].available == "S") {
                  stats[fix.availability[i].id].Selected = ++stats[fix.availability[i].id].Selected ;
                  stats[fix.availability[i].id].Available = ++stats[fix.availability[i].id].Available ;
                }
              }
              //console.log( JSON.stringify(stats) );
            }

            for(i=0; i<fix.SCORERS.length; i++) {
              // update the stats for all of the players.
              //get the stat for the playerid - if a number then add the goals to that number.
              if(fix.SCORERS[i].Player != undefined && stats[fix.SCORERS[i].IDNumber] != undefined) {
                  var stat = stats[fix.SCORERS[i].IDNumber];
                  //console.log("stat" +stat);
                  stat = stats[fix.SCORERS[i].IDNumber];
                  stat.Goals = parseInt(fix.SCORERS[i].Goals) + parseInt(stats[fix.SCORERS[i].IDNumber].Goals);
              }
            }
        });
        //console.log(stats);
        cb(stats);
        return stats;
    });
}


app.post('/addClub', jsonParser, function (req, res) {
  req.body.administrators = [];
  user = req.query.userid;
  req.body.administrators[0] = user;
  //console.log("REGISTER CLUB " +JSON.stringify(req.body));
  getNextSeq("userid", function(id) {
    req.body.clubId=id;
       addDocument(db, 'clubs', req.body, function(docs,err) {
          if(err) {
              console.log("ERROR IN addUser");
          }
          res.end(JSON.stringify(docs));
      });

  });

})

app.post('/addTeam', jsonParser, function (req, res) {
  req.body.administrators = [];
  user = req.query.userid;
  req.body.administrators[0] = user;
  console.log("REGISTER TEAM " +JSON.stringify(req.body));
  getNextSeq("userid", function(id) {

    req.body.teamId=id;
       addDocument(db, 'teams', req.body, function(docs,err) {
          if(err) {
              console.log("ERROR IN addUser");
          }
          res.end(JSON.stringify(docs));
      });

  });
})

app.post('/updateTeam', jsonParser, function (req, res) {
      console.log( "/updateTeam : " +JSON.stringify(req.body) );
      updateDocument(db, "teams" , 'teamId', req.body.teamId, req.body, function(docs) {
      res.end(JSON.stringify(docs));
    });
})


app.post('/addMessage', jsonParser, function (req, res) {
     //addDocument(db, req.query.club +"_" +req.query.team +'_mail', req.body, function(docs) {
       addDocument(db, 'mail', req.body, function(docs) {
        res.end(JSON.stringify(docs));
      //res.end(docs);
    });
})

app.get('/getMessages', function (req, res) {
      console.log( "/getMessaes : " +req );
      var qstr='{"to":"' +req.query.to +'"}';
      //findDocumentsByString(db, req.query.club +"_" +req.query.team +'_mail',  JSON.parse(qstr), function(docs) {
      findDocumentsByString(db, 'mail',  JSON.parse(qstr), function(docs) {
        res.end( JSON.stringify(docs) );
      });
})

app.get('/removeMessage', function (req, res) {
      val="ObjectId('" +req.query.id +"')";
      //removeDocumentById(db, req.query.club +"_" +req.query.team +'_mail', '_id', req.query.id , null, function(docs) {
      removeDocumentById(db, 'mail', '_id', req.query.id , null, function(docs) {
        res.end(docs);
    });

})


app.get('/getUser', function (req, res) {
      console.log( "/getUser : " +req );
      findDocumentsByID(db, 'users', "userid",  req.query.userid, function(docs) {
        //console.log(docs);
        res.end( docs );
      });

})

app.get('/getUsers', function (req, res) {
      console.log( "/getUsers : " +req );
      findAllDocuments(db, 'users', true,  "lastlogin", "-1", function(docs) {
        //console.log(docs);
        res.end( JSON.stringify(docs) );
      });

})

app.post('/addUser', jsonParser, function (req, res) {
  getNextSeq("userid", function(id) {
    req.body.userid=id;
       addDocument(db, 'users', req.body, function(docs,err) {
          if(err) {
              console.log("ERROR IN addUser");
          }
          res.end(JSON.stringify(docs));
      });
  });
})

app.post('/updateUser', jsonParser, function (req, res) {
     updateDocument(db, 'users', 'userid', req.body.userid, req.body, function(docs,err) {
        if(err) {
            console.log("ERROR IN addUser" +err);
        }
        res.end(JSON.stringify(docs));
    });
})

/**
* Login
*/
app.post('/login', jsonParser, function (req, res) {
      console.log("Login-" +JSON.stringify(req.body));
     findDocumentsByString(db, 'users', req.body, function(docs) {
       if(docs[0] != undefined) {
         //console.log("login:" +docs +" - " +docs[0]);
         docs[0].lastlogin = new Date();
         delete docs[0]["_id"];
         updateDocument(db,'users', 'userid', docs[0].userid, docs[0], function(docs) {
           res.end(JSON.stringify(docs));
         });
       }
       res.end(JSON.stringify(docs));
      //res.end(docs);
    });
})


/**
** News
*/
app.get('/getNews', function (req, res) {
      console.log( "/getNews : " +req.query.club +" " +req.query.team );
      findAllDocuments(db, req.query.club +'_' +req.query.team +'_news', false,  null, null, function(docs) {
        res.end( JSON.stringify(docs) );
      });
})

app.post('/updateNews', jsonParser, function (req, res) {
     id = req.body.IDNumber;
      if(id == undefined) {
        getNextSeq("newsid", function(id) {
          req.body.IDNumber=id;
          addDocument(db, req.query.club +"_" +req.query.team +'_news', req.body, function(docs) {
             res.end(JSON.stringify(docs));
         });
       });
      } else {
        updateDocument(db, req.query.club +"_" +req.query.team +'_news', 'IDNumber', id, req.body, function(docs) {
          res.end(JSON.stringify(docs));
        });
      }
})

/**
** fixtures
*/
app.get('/getFixtures', function (req, res) {
      console.log( "/getFixtures : " +req );
      findAllDocuments(db, req.query.club +"_" +req.query.team +'_fixtures', true, 'FIXTUREDATE', '1', function(docs) {
        res.end( JSON.stringify(docs) );
      });
})

app.get('/getFixture', function (req, res) {
      console.log( "/getFixture : " +req );
      res.end( "xxxxx" );
})

app.post('/addFixture', jsonParser, function (req, res) {
      console.log( "/addFixture : " +req );
      getNextSeq("userid", function(id) {
        req.body.id=id;
         addDocument(db, req.query.club +"_" +req.query.team +'_fixtures', req.body, function(docs,err) {
            if(err) {
                console.log("ERROR IN addUser");
            }
            res.end(JSON.stringify(docs));
        });
      });
})

app.get('/removeFixture', function (req, res) {
      console.log( "/removeFixture : " +req );
      removeDocument(db,  req.query.club +"_" +req.query.team +'_fixtures', 'id', req.query.id , function(docs,err) {
        if(err) {
            console.log("ERROR IN removeFixture " +err);
        }
        console.log("about to return from fix");
        res.end(JSON.stringify(docs));
    });
})

app.post('/updateFixture', jsonParser, function (req, res) {
      console.log( "/updateFixture : " +JSON.stringify(req.body) );
      req.body.FIXTUREDATE = new Date(req.body.FIXTUREDATE);
      updateDocument(db, req.query.club +"_" +req.query.team +'_fixtures' , 'id', req.body.id, req.body, function(docs) {
      res.end(JSON.stringify(docs));
      //res.end( "xxxxx" );
    });
})

/*****************************************
* create a token - simple hashed token
*****************************************/
/*var getToken = function(userid, clubid, teamid, callback){
    // create a hash from the time +userid.
    //store in memory
    //

  });
}*/


/*****************************************
* Get a sequence
*****************************************/
var getNextSeq = function(sequenceName, callback){
  var qstr='{ "_id" : "' +sequenceName +'" }';
  findDocumentsByString(db, 'seq', JSON.parse(qstr), function(docs) {
    seqval = docs[0].sequence_value +1;
    docs[0].sequence_value = docs[0].sequence_value +1;
    updateDocumentByQuery(db, 'seq', JSON.parse(qstr), docs[0], function(docs) {
        callback(seqval);
    });
  });
}


/**
* Fetch all documents for a "collection"
* needs the db pasing in.
*/
var findAllDocuments = function(db, collection, sorted, sortfield, ascdesc, callback) {
  // Get the documents collection
  console.log("findAllDocuments:" +collection);
  var collection = db.collection(collection);
  if (!sorted) {
    collection.find().toArray(function(err, docs) {
      assert.equal(err, null);
      var tmp = JSON.stringify(docs);
      callback(docs);
    });
  } else {
      collection.find({}, {"sort" : [[sortfield, ascdesc]]} ).toArray(function(err,docs) {
      assert.equal(err, null);
      var tmp = JSON.stringify(docs);
      callback(docs);
    });
  }
}



/**
* find Documents by ID, passing a numeric value for the ID
*/
var findDocumentsByID = function(db, coll, key, value, callback) {
  console.log(key +"/" +value);
  // Get the documents collection
  var collection = db.collection(coll);
  var qstr="{ \"" +key  +"\": " +value +" }";
  //var qstr="{ \"IDNumber\" : 607 }";
  var query = JSON.parse(qstr);
  //console.log(qstr);
  collection.find(query).toArray(function(err, docs) {
    assert.equal(err, null);
    //console.log("Found the following records");
    var tmp = JSON.stringify(docs);
    //this is a hack to remove the appended brackets [] and also the "_id"
    var newStr = "{" +tmp.substring(35, tmp .length-1);
    docs = newStr;
    //console.log(docs);
    callback(docs);
  });
}

/**
* find Documents by ID, passing a numeric value for the ID
*/
var findDocumentsByString = function(db, collection, qstr, callback) {
  console.log("findAllDocumentsByString " +collection +" " +qstr);
  // Get the documents collection
  var collection = db.collection(collection);
  //var query = JSON.parse(qstr);
  collection.find(qstr).toArray(function(err, docs) {
    assert.equal(err, null);
    if(docs.length >0) {
      //console.log("Found the following records "+docs);
      callback(docs);//JSON.stringify(docs));
    } else {
      //console.log("Empty result set for " +qstr);
      callback("");
    }
  });
}

/**
* find Documents with a key in a group, passing the in string already formatted
*/
var findDocumentsIn = function(db, collection, qstr, callback) {
  console.log("findAllDocumentsIn " +collection +" " +qstr);
  // Get the documents collection
  var collection = db.collection(collection);
  //var query = JSON.parse(qstr);
  collection.find(qstr).toArray(function(err, docs) {
    assert.equal(err, null);
    if(docs.length >0) {
      //console.log("Found the following records "+docs);
      callback(docs);//JSON.stringify(docs));
    } else {
      //console.log("Empty result set for " +qstr);
      callback("");
    }
  });
}

var updateDocument = function(db, coll, key, value, doc, callback) {
  // Get the documents collection
  var collection = db.collection(coll);
  var qstr="{ \"" +key  +"\": " +value +" }";
  var query = JSON.parse(qstr);
  //console.log(JSON.stringify(doc));

  collection.update( query, doc, function(error, doc){
    if (error) throw error;
    callback(doc);
});
}

var updateDocumentByQuery = function(db, coll, query, doc, callback) {
  // Get the documents collection
  var collection = db.collection(coll);
  //console.log(JSON.stringify(doc));

  collection.update( query, doc, function(error, doc){
    if (error) throw error;
    callback(doc);
});
}

var addDocument = function(db, coll, doc, callback) {
  // Get the documents collection
  var collection = db.collection(coll);

  collection.insert( doc, function(error, record){
    if (error) {
      console.log("ERROR IN addDocument " +error );
      callback(error);
//      throw error;
    } else {
    callback(doc);
  }
  });
}

var removeDocument = function(db, coll, key, value, callback) {
  // Get the documents collection
  var collection = db.collection(coll);
  var qstr="{ \"" +key  +"\":"  +value  +"}";
  var query = JSON.parse(qstr);
  collection.remove( query, function(error, record){
    if (error) throw error;
    callback();
  });
}


var removeDocumentById = function(db, coll, key, value, doc, callback) {
  // Get the documents collection
  var collection = db.collection(coll);
  var qstr="{ \"" +key  +"\":"  +value  +"}";
  //collection.remove( "{ _id:ObjectId('582f333621c039390a06bc59')}", function(error, record){
  collection.deleteOne( {_id: new mongodb.ObjectID(value)}, function(error, record){
    if (error) throw error;
    callback(doc);
  });
}
