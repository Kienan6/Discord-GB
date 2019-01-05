const Commando = require('discord.js-commando');
const bot = new Commando.Client();
const config = require('./config.json');
const dbutil = require('./db.js');

dbutil.connectToServer(function(err) {
	console.log("connected.");
});
bot.registry.registerDefaultTypes()
			.registerGroups([['team_commands', 'Command group built to handle team building.']])
			.registerDefaultGroups()
			.registerDefaultCommands()
			.registerCommandsIn(__dirname + '/commands');

bot.on('ready', () => {
	console.log('Logged in');
});

bot.login(config.token);

