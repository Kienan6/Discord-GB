/*
    sets team. Only leader can use command 
*/

const { Command } = require('discord.js-commando');
const path = require('path');
const dbutil = require(path.resolve('db.js'));

module.exports = class Set extends Command {
    constructor(client) {
        super(client, {
            name: 'set',
            group: 'team_commands',
            memberName: 'set_command',
            description: 'Set your current team.',
            examples: ['!set teamname'],
            guildOnly: true,
            argsType: 'multiple',
            argsCount: 2,
        });
    }
    run(msg) {
        var id = msg.author.id;
        var args = msg.parseArgs();
        if(args.length < 1 || args.length > 1){
            msg.reply('Please use format !set "[teamname]".');
            return;
        }
        var teamname = msg.cleanContent;
        teamname = teamname.substring(teamname.indexOf(" ")).trim();
        //get the team object
        dbutil.getTeam(teamname, function(str, team) {
            msg.reply(str);
            //update the user 
            if(team != null){
                if(team.leader == msg.author.id){
                    dbutil.updateUser(id, {"current": team.teamname}, function(str){
                        msg.reply(str);
                    });
                } else {
                    msg.reply('You are not the leader of this team.')
                }
            } else {
                console.log('Team returned null in set');
                msg.reply(`No team with name ${teamname} found.`);
            }
        });
    }
};