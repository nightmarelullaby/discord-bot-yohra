const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');

const { ChannelType } = require('discord-api-types/v10');
require('dotenv').config()
const { Routes } = require('discord-api-types/v9');

const commands = [
	new SlashCommandBuilder().setName('ping').setDescription('Replies with pong!'),
	new SlashCommandBuilder().setName('server').setDescription('Replies with server info!'),
	new SlashCommandBuilder().setName('join').setDescription('Joins to voice channel')
	.addChannelOption(option => 
								option.setName('channel')
								.setDescription('The channel to echo into')
								.setRequired(true)
								// Ensure the user can only select a TextChannel for output
								.addChannelTypes(ChannelType.GuildVoice))
	.addStringOption(option => 
			option.
			setRequired(true)
			.setName('query')
			.setDescription('Enter query of the video')
		)
		// .addStringOption(option => 
		// option.
		// setRequired(false)
		// .setName('url')
		// .setDescription('Enter the URL of the video')
		// )
	,
	new SlashCommandBuilder().setName('disconnect').setDescription('Disconnects the from at voice channel'),						
	new SlashCommandBuilder().setName('help').setDescription('Displays a embed with all the information of the bot'),
	new SlashCommandBuilder().setName('next').setDescription('Plays the next music in the play list'),
	new SlashCommandBuilder().setName('chat-2b').setDescription('chatgpt ia')
	.addStringOption(option => 
			option.
			setRequired(true)
			.setName('input')
			.setDescription('Answer everything you want.')
		)
]
	.map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(process.env.BOT_TOKEN);

rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(err => console.log(err));