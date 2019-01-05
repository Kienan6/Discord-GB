/*
    Post a match
*/

const { Command } = require('discord.js-commando');
const { RichEmbed } = require('discord.js');
const path = require('path');
const dbutil = require(path.resolve('db.js'));

module.exports = class Match extends Command {
    constructor(client) {
        super(client, {
            name: 'match',
            group: 'team_commands',
            memberName: 'match_command',
            description: 'Create a match for your currently selected team.',
            examples: ['!match [play/create/report] [team/gametype/win,loss]'],
            guildOnly: true,
            argsType: 'multiple',
            argsCount: 2,
            wait: 10
        });
    }
    run(msg) {
        var id = msg.author.id;
        var args = msg.parseArgs();
        var t = this;
        if(args.length < 2){
            this.showMatch(msg, id);
            return;
        }
        //get identifier from the message
        var identifier = msg.cleanContent;
        let create = true;//default
        let report = false;
        if(args[1] == ""){
            msg.reply("Please use !match [play/create/report] [team/gametype/win,loss]");
            return;
        }
        if(args[0] == "create"){
            create = true;
        } else if(args[0] == "play"){
            create = false;
        } else if(args[0] == "report"){
            report = true;
        }else {
            msg.reply("Please use !match [play/create/report] [team/gametype/win,loss]");
            return;
        }
        //make sure user is leader and check for current matches
        dbutil.getUser(id, function(str, user) {
            if(user == null){
                msg.reply(str);
                return;
            }
            //create or play
            if(create && report == false){
                t.createMatch(msg, user, args[1]);
            } else if(create == false && report == false){
                t.playMatch(msg, user, args[1]);
            } else {//report
                t.reportMatch(msg, user, args[1]);
            }
        });
    }
    reportMatch(msg, author, report) {
        var t = this;
        dbutil.getTeam(author.current, function(str, team){
            if(team == null){
                msg.embed(t.createEmbed('Error', 'Team not found', ' ', 'RED'));
                return;
            }
            var team_this = team;
            dbutil.getMatch(team.match, function(match) {
                if(match == null){
                    msg.embed(t.createEmbed('Error', 'No matches scheduled.', ' ', 'RED'));
                    return;
                }
                if(match.team_visitor != "" && match.team_owner != "" ){
                    //if we created this match
                    var own_str = {"visitor_report" : report };
                    if(match.team_owner == team_this.teamname) {
                        own_str = {"owner_report" : report };
                    }
                    msg.embed(t.createEmbed('Current Match', `${match.team_owner} vs ${match.team_visitor} in ${match.gametype}`, `${match.ladder}`, 'BLUE'));
                    dbutil.updateMatch(match._id, own_str, function(updated) {
                        if(updated == null){
                            msg.embed(t.createEmbed('Error', 'Could not report.'));
                            return;
                        }
                        console.log(updated.visitor_report +" "+updated.owner_report);
                        if(updated.visitor_report == "loss" && updated.owner_report == "win") {
                            msg.embed(t.createEmbed('Final', `${updated.team_owner} won the match`, `Ladder: ${match.ladder}\'s`, 'GREEN'));
                            addWin(updated.team_owner);
                            addLoss(updated.team_visitor);
                            updateElo(updated.team_owner, updated.team_visitor);
                        } else if(updated.visitor_report == "win" && updated.owner_report == "win"){ 
                            msg.embed(t.createEmbed('Disputed', `Match disputed.`, `Ladder: ${match.ladder}\'s`, 'RED'));
                            //HANDLE THE
                        } else if(updated.visitor_report == "win" && updated.owner_report == "loss"){ 
                            msg.embed(t.createEmbed('Final', `${updated.team_visitor} won the match`, `Ladder: ${match.ladder}\'s`, 'BROWN'));
                            addWin(updated.team_visitor);
                            addLoss(updated.team_owner);
                            updateElo(updated.team_visitor, updated.team_owner);
                        } else { //not reported
                             msg.embed(t.createEmbed('Reported', `${team_this.teamname} reporting a ${report}`, `Ladder: ${match.ladder}\'s`, 'GREEN'));
                        }
                    });
                    //TODO - UPDATE XP FOR TEAM
                } else {
                    msg.embed(t.createEmbed('Error', 'Waiting for team to accept match. Can not report.', `Team: ${team.teamname}`, 'RED'));
                }
            });
        });
    }
    //t1 is winner t2 is loser
    updateElo(t1, t2) {
        dbutil.getTeam(team1, function(str, team1) {
            if(team == null){
                return;
            }
            dbutil.getTeam(t2, function (str, team2) {
                if(team2 == null){
                    return;
                }
                let prob1 = (1.0/(1.0+Math.pow(10, (team1.xp - team2.xp)/400)));
                let prob2 = (1.0/(1.0+Math.pow(10, (team2.xp - team1.xp)/400)));
                let K = 30;
                let newTeam1 = team1.xp + K*(1 - prob1);
                let newTeam1 = team2.xp + K*(0 - prob2);
                dbutil.updateTeam(t1, {"xp" : newTeam1 }, function(str) {
                    console.log("Winner New XP: "+ newTeam1);
                    console.log(str);
                    dbutil.updateTeam(t2, {"xp" : newTeam2 }, function(str) {
                        console.log("Loser New XP: "+ newTeam2);
                        console.log(str);
                    });
                });
            });

        });
    }
    addWin(teamname) {
        dbutil.getTeam(teamname, function(str, team) {
            if(team == null){
                console.log(str);
                return false;
            }
            dbutil.updateTeam(teamname, {"wins" : team.wins + 1}, function(str){
                console.log(str);
            })
        });
    }
    addLoss(teamname) {
        dbutil.getTeam(teamname, function(str, team) {
            if(team == null){
                console.log(str);
                return false;
            }
            dbutil.updateTeam(teamname, {"wins" : team.wins -1}, function(str){
                console.log(str);
            })
        });
    }
    showMatch(msg, author){
        var t = this;
        dbutil.getUser(author, function(str, user){
            if(user == null){
                console.log(str);
                return;
            }
            dbutil.getTeam(user.current, function(str, team){
                if(team == null){
                    msg.embed(t.createEmbed('Error', 'Team not found', ' ', 'RED'));
                    return;
                }
                dbutil.getMatch(team.match, function(match) {
                    if(match == null){
                        msg.embed(t.createEmbed('Error', 'No matches scheduled.', ' ', 'RED'));
                        return;
                    }
                    if(match.team_visitor != "" && match.team_owner != "" ){
                        msg.embed(t.createEmbed('Current Match', `${match.team_owner} vs ${match.team_visitor} in ${match.gametype}`, `${match.ladder}`, 'BLUE'));
                    } else {
                        msg.embed(t.createEmbed('Current Match', 'Waiting for team to accept match', `Team: ${team.teamname}`, '0xFFEA00'));
                    }
                });
            });
        });
    }
    createMatch(msg, user, gametype) {
        dbutil.getTeam(user.current, function(str, team) {
            if(team == null){
                msg.reply('Set your current team with !set [team name]');
                return;
            }
            if(team.leader != user.user_id) {
                msg.reply('You are not the leader of this team.');
                return;
            }
            if(team.match != 0){
                msg.reply('There is already a match in progress for this team.');
                return;
            }
            //create the match
            dbutil.createMatch(team.teamname, gametype, function(str, match_id) {
                if(match_id == null){
                    msg.reply(str);
                    return;
                }
                dbutil.updateTeam(team.teamname, {"match": match_id}, function(success) {
                    console.log(`${success}:::${team.teamname} has a match with id ${match_id}`);
                    msg.embed(new RichEmbed()
                    .setTitle("Match")
                    .setDescription(str)
                    .setColor('PURPLE'));
                    });
                });
        });
    }
    playMatch(msg, user, teamname) {
        var t = this;
        dbutil.getTeam(user.current, function(str, team) {
            if(team == null){
                msg.reply('Set your current team with !set [team name]');
                return;
            }
            if(team.leader != user.user_id) {
                msg.reply('You are not the leader of this team.');
                return;
            }
            if(team.match != 0){
                msg.reply('There is already a match in progress for this team.');
                return;
            }
            //get the specified team and their current match
            dbutil.getTeam(teamname, function(str, opponent_team){
                if(opponent_team == null) {
                    msg.embed(t.createEmbed('Error', str, '', 'RED'));
                    return;
                }
                //get match
                dbutil.getMatch(opponent_team.match, function(match) {
                    if(match == null){
                        msg.embed(t.createEmbed('Error', `No match found for ${opponent_team.teamname}`, '', 'RED'));
                        return;
                    }
                    if(team.ladder != opponent_team.ladder){
                        msg.embed(t.createEmbed('Error', `Teams are not competing on the same ladder.`, '', 'RED'));
                        return;
                    }
                    if(match.team_visitor != ""){
                        msg.embed(t.createEmbed('Error', 'Match already accepted.', '', 'RED'));
                        return;
                    }
                    //update the match and team... might just want to update team here
                    dbutil.updateMatch(match._id, {"team_visitor": user.current}, function(updated){
                        if(updated == null){
                            msg.embed(t.createEmbed('Error', 'Unable to play opponent team. Match no longer exists', '', 'RED'));
                            return;
                        }
                        dbutil.updateTeam(user.current, {"match" : match._id}, function(str){
                            console.log(str);
                            msg.embed(t.createEmbed('Match Created', `${team.teamname} playing ${opponent_team.teamname} in ${match.gametype}`, '', 'GREEN'));
                        });
                    });
                });
            });
        });
    }
    createEmbed(title, message, footer, color) {
        let embed = new RichEmbed();
        embed.setTitle(title).setDescription("").setColor(color);
        //add each match to the embed
        embed.setDescription(message);
        embed.setFooter(footer);
        return embed;
    }
};