/*
	Creates a team involving the user and their mentions.
	Updates the database. 
*/

/*
Todo:
create database connection
create team
*/

const { Command } = require('discord.js-commando');
const { RichEmbed } = require('discord.js');
const path = require('path');
const dbutil = require(path.resolve('db.js'));

module.exports = class Team extends Command {
    constructor(client) {
        super(client, {
            name: 'team',
            group: 'team_commands',
            memberName: 'team_commands',
            description: 'Creates a team.',
            examples: ['!team teamname [@user @user ..].'],
            guildOnly: true,
            argsType: 'multiple',
            argsCount: 5,
        });
    }
    createEmbed(title = '', message = '', footer = '', color = 'RED') {
        let embed = new RichEmbed();
        embed.setTitle(title).setDescription("").setColor(color);
        //add each match to the embed
        embed.setDescription(message);
        embed.setFooter(footer);
        return embed;
    }
    run(msg) {
    	//get teamname
    	var teamname = msg.parseArgs().filter(name => {
    		if(!name.startsWith('<@'))
    			return name;
    	});
    	if(teamname.length > 1){
    		msg.reply('More than one team name specified.');
    		return;
    	} else if(teamname.length == 0){
            var t = this;
    		dbutil.getUser(msg.author.id, function(str, user) {
                if(user == null){
                    console.log(str);
                    msg.reply("Please register before using commands");
                    return;
                } else {
                    if(user.current != ""){
                       dbutil.getTeam(user.current, function(str, team){
                            if(team == null){
                                msg.embed(t.embed('Could not find team'));
                                return;
                            }
                            msg.embed(t.createEmbed(`${team.teamname}`, `Wins: ${team.wins} Losses: ${team.losses} XP: ${team.xp}`, `Ladder: ${team.ladder}'s`, '0x34A600'));
                       });
                    } else {
                        msg.embed(t.createEmbed('Team not found.'));
                    }
                }
            });
    		return;
    	}
    	teamname = teamname[0];
    	var mentions = msg.mentions.users.array();
    	var members = [];
    	var leader = msg.author;

    	mentions.forEach(member => {
    		if(leader.username != member.username) {
    			members.push(member.id);
    		}
    	});
    	var ladder = members.length +1;
    	leader = leader.id;

    	//CHECK FOR UNREGISTERED PLAYERS AND DUPLICATES

    	dbutil.getUser(leader, function(str, user) {
    		if(user == null){
    			msg.reply(" you have not registered. ");
    			return;
    		}
    		if(ladder == 1 && user.singles != ""){
    			msg.reply(`${user.username} already registered for singles`);
    			return;
    		} else if(ladder == 2 && user.doubles != ""){
    			msg.reply(`${user.username} already registered for doubles`);
    			return;
    		} else {
    			if(user.teams != ""){
    				msg.reply(`${user.username} already registered for teams`);
    				return;
    			}
    		}
            if(members.length != 0){
        		members.forEach(mem => {
    	    		dbutil.getUser(mem, function(str, user) {
    		    		if(user == null){
    		    			msg.reply( "A member has not registered. " );
    		    			return;
    					}
    					if(ladder == 1 && user.singles != ""){
    						msg.reply(`${user.username} already registered for singles`);
    						return;
    					} else if(ladder == 2 && user.doubles != ""){
    						msg.reply(`${user.username} already registered for doubles`);
    						return;
    					} else {
    						if(user.teams != ""){
    							msg.reply(`${user.username} already registered for teams`);
    							return;
    						}
    					}

    					//insert the team
    		 			//create team object to pass to database.
    			    	var team = {
    			    		"leader": leader, 
    			    		"members": members, 
    			    		"teamname": teamname, 
    			    		"ladder": ladder,
    			    		"match": 0,
    			    		"xp": 0,
    			    		"wins": 0,
    			    		"losses": 0
    			    	};
    			    	//add the team
    			    	dbutil.addTeam(team, function(success, str) {
    			    		msg.reply(str);
    			    	});
    	    		});
    	    	});
            } else {
                //insert the team
                //create team object to pass to database.
                var team = {
                    "leader": leader, 
                    "members": members, 
                    "teamname": teamname, 
                    "ladder": ladder,
                    "match": 0,
                    "xp": 0,
                    "wins": 0,
                    "losses": 0
                };
                //add the team
                dbutil.addTeam(team, function(success, str) {
                    msg.reply(str);
                });
            }
    	});
	}
};