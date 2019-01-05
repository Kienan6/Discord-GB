/*
    Creates a new user.
*/

const { Command } = require('discord.js-commando');
const path = require('path');
const dbutil = require(path.resolve('db.js'));

module.exports = class Register extends Command {
    constructor(client) {
        super(client, {
            name: 'register',
            group: 'team_commands',
            memberName: 'user_command',
            description: 'Register as a new user on the discord.',
            examples: ['!register [description] '],
            guildOnly: true,
            argsType: 'multiple',
            argsCount: 2,
        });
    }
    run(msg) {
        var username = msg.author.username;
        var id = msg.author.id;
        var desc = msg.cleanContent;
        desc = desc.substring(desc.indexOf(" ")).trim();
        if(desc == ""){
            msg.reply("Please include a description.");
            return;
        }
        //create a new user object for the data base
        var user = {
            "username": username,
            "user_id": id,
            "description": desc,
            "singles": "",
            "doubles": "",
            "teams": "",
            "current": "",
            "wins": 0,
            "losses": 0,
        }
       dbutil.addUser(user, function(str){
            msg.reply(str);
        });
    }
};