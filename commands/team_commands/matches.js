/*
    SHow all matches available

*/

const { Command } = require('discord.js-commando');
const { RichEmbed } = require('discord.js');
const path = require('path');
const dbutil = require(path.resolve('db.js'));

module.exports = class Matches extends Command {
    constructor(client) {
        super(client, {
            name: 'matches',
            group: 'team_commands',
            memberName: 'matches_command',
            description: 'See current games available for your selected team',
            examples: ['!matches'],
            guildOnly: true,
            argsType: 'multiple',
            argsCount: 2,
        });
    }
    run(msg) {
        var id = msg.author.id;
        var args = msg.parseArgs();
        var i = this;
        if(args.length > 2){
            msg.reply('Please use format !matches.');
            return;
        }
        dbutil.getUser(id, function(str, user) {
            if(user == null){
                msg.reply('Can not get user.');
                return;
            } else {//create match board
                if(user.current == "" || args[0] == "all"){//get all
                    dbutil.getMatches(0, function(str, matches) {
                        msg.embed(i.createEmbed(matches));
                    });
                } else {//get per their selected team
                        dbutil.getTeam(user.current, function(str, team) {
                            if(team == null){
                                console.log(`Error finding ${user.current}`);
                                msg.reply("There was an error finding your current team.");
                                return;
                            }
                            dbutil.getMatches(team.ladder, function(str, matches) {
                                msg.embed(i.createEmbed(matches));
                            });
                        });
                }
            }
        });
    }
    createEmbed(matches) {
        var embed = new RichEmbed();
        if(matches.length == 0){
            embed.setTitle("No available matches").setDescription("").setColor("GREY");
            return embed;
        }
        embed.setTitle("Available matches").setDescription("").setColor("GOLD");
        //add each match to the embed
        matches.forEach(match => {
            embed.addField(`Team: ${match.team_owner} Gametype: ${match.gametype}`,`Ladder: ${match.ladder}'s`);
        });
        embed.setFooter(`${matches.length} games found.`);
        return embed;
    }
};