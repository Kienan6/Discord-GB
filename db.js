var MongoClient = require( 'mongodb' ).MongoClient;

var _db;

module.exports = {
//called once
  connectToServer: function( callback ) {
    MongoClient.connect( "mongodb://localhost:27017", function( err, client ) {
      _db = client.db("teambot");
      return callback( err );
    } );
  },
  //returns instance of the database
  getDb: function() {
    return _db;
  },
  //addUser({user}, callback(str))
  addUser: function(user, callback) { // returns a string
    	for(var x in user){
  		if(Object.prototype.hasOwnProperty.call(user,x)){
  			if(x === null || x === "" || x ==="null" || typeof x === "undefined"){
  				console.log('addUser(): error with passed object.');
  				return 'There was an error adding your profile. Please try again.';
  			}
  		}
  	}
  	//add the user if they dont exist
  	_db.collection("users").findOne({"user_id": user.user_id}, function(err, result) {
  		if(err) throw err;
  		if(result != null){
  			console.log(`${user.username} attempted to register twice.`);
  			callback(` you have already registered. Use !update to modify your profile.`);
  		} else {
  			_db.collection("users").insertOne(user, function(err, res){
  				if(err) throw err;
  				console.log(`${user.username} added to user database.`);
  				callback(` you have been registered. Use !help for more.`);
  			});
  		}
  	});

  },
  //addTeam({team}, callback(string))
  addTeam: function(team, callback) { //returns a string
    //make sure all fields are not null
  	for(var x in team){
  		if(Object.prototype.hasOwnProperty.call(team,x)){
  			if(x === null || x === "" || x ==="null" || typeof x === "undefined"){
  				console.log('addTeam(): error with passed object.');
  				return 'There was an error creating your team. Please try again.';
  			}
  		}
  	}
  	//if teamname exists
  	_db.collection("teams").findOne({"teamname": team.teamname}, function(err, result) {
     		if (err) throw err;
     		if(result != null) {
     			console.log(`${team.teamname} is already taken.`);
     			callback(false, `${team.teamname} is already taken.`);
     			return;
     		} else {
  			_db.collection("teams").insertOne(team, function(err, res) {
  				if (err) throw err;
  				if(team.ladder == 1){
  					_db.collection("users").updateOne({ "user_id": team.leader }, { $set: {"singles": team._id} });
  				} else if(team.ladder == 2){
  					_db.collection("users").updateOne({ "user_id": team.leader }, { $set: {"doubles": team._id} });
  				} else{
  					_db.collection("users").updateOne({ "user_id": team.leader }, { $set: {"teams": team._id} });
  				}
  				team.members.forEach(player => {
  					if(team.ladder == 1){
  						_db.collection("users").updateOne({ "user_id": player.user_id }, { $set: {"singles": team._id} });
  					} else if(team.ladder == 2){
  						_db.collection("users").updateOne({ "user_id": player.user_id }, { $set: {"doubles": team._id} });
  					} else{
  						_db.collection("users").updateOne({ "user_id": player.user_id }, { $set: {"teams": team._id} });
  					}
  				});
  				console.log(`Team: ${team.teamname} was inserted.`);
  				callback(true, `${team.teamname} was created and will compete in the ${team.ladder}'s ladder.`);
  			});
     		}
      });
  },//end function
  //updateTeam("teamname", {field}, callback(string))
  updateTeam: function(teamname, field, callback) { //returns a string
  	 this.getTeam(teamname, function(str, team) {
  		if(team == null){
  			callback(`${teamname} not found.`);
  			return;
  		}
			_db.collection("teams").updateOne({ "teamname": teamname }, { $set: field }, function(res){
        if(res.acknowledgement) {
          console.log(`Updated ${teamname}`);
          callback(`Updated ${teamname}`);
        } else {
          console.log("Could not update team.");
          callback(`Could not update team.`);
        }
      });
  	});
  },
  getTeam: function(teamname, callback) { // returns a string and team
  	_db.collection("teams").findOne({"teamname": teamname}, function(err, team) {
  		if(err) throw err;
  		if(team == null){
  			console.log(`${teamname} not found.`);
  			callback(`${teamname} not found.`,null);
  		} else {
  			callback('Team found', team);
  		}
  	});
  },
  //updateUser(user id, {field}, callback(string));
  updateUser: function(user_id, field, callback) { // returns a string
  	_db.collection("users").findOne({"user_id": user_id}, function(err, user) {
  		if(user == null){
  			callback(`User id ${user_id} not found.`);
  			return;
  		} else {
  			_db.collection("users").updateOne({ "user_id": user_id }, { $set: field });
  			console.log(`Updated ${user_id}`);
  			callback('Updated');
  		}
  	});
  },
  //getUser(user id, callback(str))
  getUser: function(user_id, callback) { //returns a string and user
  	_db.collection("users").findOne({"user_id": user_id}, function(err, user) {
  		if(user == null){
  			callback(`User id ${user_id} not found.`, null);
  		} else {
  			//return a user object
  			console.log(`${user.username} was found with user_id: ${user_id}`)
  			callback('Found user', user);
  		}
  	});
  },
  createMatch: function(teamname, gametype, callback) { // returns a string and match id
    this.getTeam(teamname, function(str, team) {
        if(team == null){
          console.log(`Error creating match for ${teamname}`);
          callback(str, null);
          return;
        }

        var match = {
            "team_owner": team.teamname,
            "team_visitor": "",
            "owner_report" : "",
            "visitor_report" : "",
            "completed": 0,
            "gametype": gametype,
            "ladder": team.ladder,
        };
        if(team.match != 0) {
          callback(`${team.teamname} already scheduled for a match.`,null)
          return;
        }
        _db.collection("games").insertOne(match, function(err, res){
          if(err) throw err;
          console.log(`Match for ${team.teamname} created.`);
          callback(`${team.teamname} playing ${gametype} in ${team.ladder}'s ladder.`, res.insertedId);
        });
    });
  },
  getMatch: function(match_id, callback) {
    _db.collection("games").findOne({"_id": match_id}, function(err, match) {
      if(err) throw err;
      callback(match);
    });
  },
  updateMatch: function(match_id, field, callback){
    var t = this;
    this.getMatch(match_id, function(match) {
      if(match == null){
        console.log(`Updating match ${match_id} failed, not found.`);
        callback(false);
        return;
      }
      _db.collection("games").updateOne({ "_id": match_id }, { $set: field }, function(err, res){
        if(err) {
          callback(null);
        } else {
          t.getMatch(match_id, callback);
        }
      });
    });
  },
  getMatches: function(ladder, callback) {//returns all matches available as an array
  	if(ladder == 0){
  		_db.collection("games").find({}).toArray(function(err, matches) {
  			if(err) throw err;
  			callback('', matches);
  		}); 
  	} else {
  		_db.collection("games").find({"ladder": ladder}).toArray(function(err, matches) {
  			if(err) throw err;
  			callback('', matches);
  		}); 
  	}
  }
};