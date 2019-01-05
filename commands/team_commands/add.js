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
const mongoClient = require('mongodb').MongoClient;
const path = require('path');
const config = require(path.resolve('config.json'));
module.exports = class Add extends Command {
    constructor(client) {
        super(client, {
            name: 'add',
            group: 'team_commands',
            memberName: 'add',
            description: 'Adds a member to an existing team.',
            examples: ['!add teamname [@user @user].'],
            guildOnly: true,
            argsType: 'multiple',
            argsCount: 5,
        });
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
    		msg.reply('Please specify a team name.');
    		return;
    	}
    	teamname = teamname[0];

    	if(!msg.mentions.users.array().length){
    		msg.reply('Creating a singles squad');
    		return;
    	}
        
    	console.log('members:'+msg.mentions.users.array());

    }
};