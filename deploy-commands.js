// const { SlashCommandBuilder } = require('@discordjs/builders');
// const { REST } = require('@discordjs/rest');

// const { ChannelType } = require('discord-api-types/v10');
// require('dotenv').config()
// const { Routes } = require('discord-api-types/v9');

// const commands = [
// 	new SlashCommandBuilder().setName('ping').setDescription('Replies with pong!'),
// 	new SlashCommandBuilder().setName('server').setDescription('Replies with server info!'),
// 	new SlashCommandBuilder().setName('join').setDescription('Joins to voice channel')
// 	.addChannelOption(option => 
// 								option.setName('channel')
// 								.setDescription('The channel to echo into')
// 								.setRequired(true)
// 								// Ensure the user can only select a TextChannel for output
// 								.addChannelTypes(ChannelType.GuildVoice))
// 	.addStringOption(option => 
// 			option.
// 			setRequired(true)
// 			.setName('query')
// 			.setDescription('Enter query of the video')
// 		)
// 		// .addStringOption(option => 
// 		// option.
// 		// setRequired(false)
// 		// .setName('url')
// 		// .setDescription('Enter the URL of the video')
// 		// )
// 	,
// 	new SlashCommandBuilder().setName('disconnect').setDescription('Disconnects the from at voice channel'),						
// 	new SlashCommandBuilder().setName('help').setDescription('Displays a embed with all the information of the bot'),
// 	new SlashCommandBuilder().setName('next').setDescription('Plays the next music in the play list'),
// 	new SlashCommandBuilder().setName('chat-2b').setDescription('chatgpt ia')
// 	.addStringOption(option => 
// 			option.
// 			setRequired(true)
// 			.setName('input')
// 			.setDescription('Answer everything you want.')
// 		)
// ]
// 	.map(command => command.toJSON());

// const rest = new REST({ version: '9' }).setToken(process.env.BOT_TOKEN);

// rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands })
// 	.then(() => console.log('Successfully registered application commands.'))
// 	.catch(err => console.log(err));


import { REST, Routes } from 'discord.js';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Convert import.meta.url to a file path to get __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

// Load config.json using fs.readFileSync and JSON.parse
const auth = JSON.parse(readFileSync(new URL('./config.json', import.meta.url)));

const TOKEN = auth?.token;
const clientId = auth.clientId;
const guildId = auth.guildId; // Assuming guildId is also in config.json for guild commands

const commands = [];
// Grab all the command folders from the commands directory you created earlier
const foldersPath = join(__dirname, 'commands');
const commandFolders = readdirSync(foldersPath);

for (const folder of commandFolders) {
	// Grab all the command files from the commands directory you created earlier
	const commandsPath = join(foldersPath, folder);
	const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
	for (const file of commandFiles) {
		const filePath = join(commandsPath, file);
		// Dynamic import for ES Modules

		 const moduleUrl = pathToFileURL(filePath).href;
			// console.log(`Attempting to import: ${moduleUrl}`);
		await import(moduleUrl)
			.then(commandModule => {
				const command = commandModule.default || commandModule; // Handle default exports or named exports
				if ('data' in command && 'execute' in command) {
					commands.push(command.data.toJSON());
				} else {
					console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
				}
			})
			.catch(error => {
				console.error(`Error importing command file ${filePath}:`, error);
			});
	}
}
console.log(commands)
// Construct and prepare an instance of the REST module
const rest = new REST().setToken(TOKEN); // Use TOKEN here, not token

// // and deploy your commands!
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationGuildCommands(clientId, guildId), // Use guildId here
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();