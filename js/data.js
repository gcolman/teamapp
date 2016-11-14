var express = require('express');
var app = express();
var fs = require("fs");
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
var wsserver = ws.createServer(function (conn) {
    console.log("New connection")
    //var connection = request.accept('echo-protocol', request.origin);
    connections.push(conn);

    conn.on('error', function (err) {
        if (err.code !== 'ECONNRESET') {
            // Ignore ECONNRESET and re throw anything else
            throw err
        } else {
          console.log(err);
        }
    })

    conn.on("text", function (str) {
        console.log("Received "+str)
        for(var i = 0; i < connections.length; i++) {
            connections[i].sendText(str);
        }
    })

    conn.on("close", function (code, reason) {
        console.log("Connection closed")
    })
}).listen(8001)

//static pages
//TODO genericise
app.use(express.static('/home/gcolman/private/5Teamapp'));
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
* Players
*/
app.get('/getPlayers', function (req, res) {
      console.log( "/getPalyers : " +req );
      findAllDocuments(db, 'players', false,  null, null, function(docs) {
        res.end( JSON.stringify(docs) );
      });

})

app.get('/getPlayersWithStats', function (req, res) {
      console.log( "/getPalyers : " +req );
      findAllDocuments(db, 'players', false,  null, null, function(docs) {
        var stats = getAllStats(function(stats){
          docs.forEach(function(player) {
              //add the stat to the player.
              player["gameStats"] = stats[player.IDNumber];
          });
            res.end( JSON.stringify(docs) );
        });
      });

})

app.get('/getPlayer', function (req, res) {
      console.log( "/getPlayer : " +req.query.id );
      findDocumentsByID(db, 'players', 'IDNumber', +req.query.id, function(docs) {
        console.log(JSON.stringify(docs) );
        res.end(docs);
      });
})

app.get('/addPlayer', function (req, res) {
      console.log( "/addPlayer : " +req );
      res.end( "xxxxx" );
})

app.get('/getStats', function (req, res) {
      console.log( "/getStats : " +req.query.id );
      findAllDocuments(db, 'stats', false, null, null, function(docs) {
        //console.log(JSON.stringify(docs) );
        res.end(docs);
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
      res.end( JSON.stringify(getAllStats()) );
})

var getAllStats= function(cb) {
    console.log("/getAllStats");
    var stats={};
    //get all fixtures
    findAllDocuments(db, 'fixtures', false,  null, null, function(fixtures) {
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
                  stats[fix.availability[i].id] = stat;
                } else {
                  stat = stats[stats[fix.availability[i].id]]
                }

                // So add the stat.
                if(fix.availability[i].available == "A") {
                  stats[fix.availability[i].id].Available = ++stats[fix.availability[i].id].Available ;
                } else if(fix.availability[i].available == "P") {
                  stats[fix.availability[i].id].Played = ++stats[fix.availability[i].id].Played;
                } else if(fix.availability[i].available == "N") {
                  stats[fix.availability[i].id].NotAvailable = ++stats[fix.availability[i].id].NotAvailable ;
                } else if(fix.availability[i].available == "I") {
                  stats[fix.availability[i].id].Injured = ++stats[fix.availability[i].id].injured ;
                } else if(fix.availability[i].available == "X") {
                  stats[fix.availability[i].id].NoPlay = ++stats[fix.availability[i].id].NoPlay ;
                } else if(fix.availability[i].available == "C") {
                  stats[fix.availability[i].id].NoAnswer = ++stats[fix.availability[i].id].NoAnswer ;
                }
              }
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


app.get('/removePlayer', function (req, res) {
      console.log( "/removePlayer : " +req );
      removeDocument(db, 'players', 'IDNumber', +req.query.id, function(docs) {
        console.log(JSON.stringify(docs) );
        res.end(docs);
    });
      res.end( "xxxxx" );
})

app.post('/updatePlayer', jsonParser, function (req, res) {
      console.log("Updaterere" +JSON.stringify(req.body));
      updateDocument(db, 'players', 'IDNumber', +req.body.IDNumber, req.body, function(docs) {
        res.end(JSON.stringify(docs));
      //res.end(docs);
    });
})

app.post('/addPlayer', jsonParser, function (req, res) {
     addDocument(db, 'players', req.body, function(docs) {
       if(err) throw err;
        res.end(JSON.stringify(docs));
      //res.end(docs);
    });
})

app.get('/getUser', function (req, res) {
      console.log( "/getUser : " +req );
      findDocumentsByID(db, 'users', "userid",  req.query.userid, function(docs) {
        console.log(docs);
        res.end( docs );
      });

})

app.get('/getUsers', function (req, res) {
      console.log( "/getUsers : " +req );
      findAllDocuments(db, 'users', false,  "lastlogin", null, function(docs) {
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
            console.log("ERROR IN addUser");
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
       if(docs != null) {
         console.log("login:" +docs +" - " +docs[0]);
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
      console.log( "/getNews : " +req );
      findAllDocuments(db, 'news', false,  null, null, function(docs) {
        res.end( JSON.stringify(docs) );
      });
})

app.post('/updateNews', jsonParser, function (req, res) {
      updateDocument(db, 'news', 'IDNumber', +req.body.IDNumber, req.body, function(docs) {
        res.end(JSON.stringify(docs));
      //res.end(docs);
    });
})

/**
** fixtures
*/
app.get('/getFixtures', function (req, res) {
      console.log( "/getFixtures : " +req );
      findAllDocuments(db, 'fixtures', true, 'DATE', '1', function(docs) {
        res.end( JSON.stringify(docs) );
      });
})

app.get('/getFixture', function (req, res) {
      console.log( "/getFixture : " +req );
      res.end( "xxxxx" );
})

app.get('/addFixture', function (req, res) {
      console.log( "/addFixture : " +req );
      res.end( "xxxxx" );
})

app.get('/removeFixture', function (req, res) {
      console.log( "/removeFixture : " +req );
      res.end( "xxxxx" );
})

app.post('/updateFixture', jsonParser, function (req, res) {
      console.log( "/updateFixture : " +JSON.stringify(req.body) );

      updateDocument(db, 'fixtures', 'id', req.body.id, req.body, function(docs) {

      res.end(JSON.stringify(docs));
      //res.end( "xxxxx" );
    });
})

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
  var collection = db.collection(collection);
  if (!sorted) {
    console.log("not sort");
    collection.find().toArray(function(err, docs) {
      assert.equal(err, null);
      var tmp = JSON.stringify(docs);
      callback(docs);
    });
  } else {
    //collection.find().sort(sortfield +":" +ascdesc).toArray(function(err, docs) {
    console.log(sortfield +":" +ascdesc );
    collection.find().sort({DATE: 1}).toArray(function(err, docs) {
      assert.equal(err, null);
      var tmp = JSON.stringify(docs);
      console.log(tmp);
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
  console.log(qstr);
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
  // Get the documents collection
  var collection = db.collection(collection);
  //var query = JSON.parse(qstr);
  collection.find(qstr).toArray(function(err, docs) {
    assert.equal(err, null);
    console.log("Found the following records "+docs);
    if(docs.length >0) {
      callback(docs);
    } else {
      callback(docs);
    }
  });
}

var updateDocument = function(db, coll, key, value, doc, callback) {
  // Get the documents collection
  var collection = db.collection(coll);
  var qstr="{ \"" +key  +"\": " +value +" }";
  var query = JSON.parse(qstr);
  console.log("replacing" +JSON.stringify(query) +" with " +JSON.stringify(doc));
  //console.log(JSON.stringify(doc));

  collection.update( query, doc, function(error, doc){
    if (error) throw error;
    console.log("data saved");
    callback(doc);
});
}

var updateDocumentByQuery = function(db, coll, query, doc, callback) {
  // Get the documents collection
  var collection = db.collection(coll);
  console.log("replacing" +JSON.stringify(query) +" with " +JSON.stringify(doc));
  //console.log(JSON.stringify(doc));

  collection.update( query, doc, function(error, doc){
    if (error) throw error;
    console.log("data saved");
    callback(doc);
});
}

var addDocument = function(db, coll, doc, callback) {
  // Get the documents collection
  var collection = db.collection(coll);

  collection.insert( doc, function(error, record){
    if (error) {
      console.log("ERROR IN addDocument");
      callback(error);
//      throw error;
    } else {
    console.log("data saved");
    callback(doc);
  }
  });
}

var removeDocument = function(db, coll, key, value, doc, callback) {
  // Get the documents collection
  var collection = db.collection(coll);
  var qstr="{ \"" +key  +"\":"  +value  +"}";
  var query = JSON.parse(qstr);
  console.log(query);
  collection.remove( query, function(error, record){
    if (error) throw error;
    console.log("data removed");

  });
}
