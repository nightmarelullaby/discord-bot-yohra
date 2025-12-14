import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';
import { Client, Collection, Events, GatewayIntentBits, MessageFlags, REST, Routes } from 'discord.js';
import auth from './config.js';
import { pathToFileURL } from 'node:url';
import audioPlayer from './entity/audioPlayer.js';
import { createNewEmbed } from './utils/actions.js';
const TOKEN = auth?.token
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const clientId = auth.clientId

const client = new Client({ intents:
    [
        GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
    ] });

client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.login(TOKEN);

client.commands = new Collection();
const __filename = fileURLToPath(import.meta.url);
const __dirname = import.meta.dirname || dirname(__filename);

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const moduleUrl = pathToFileURL(filePath).href;
        // console.log(`Attempting to import: ${moduleUrl}`);
        const command = await import(moduleUrl).then(module => module.default);

        // console.log(command)
       if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}

        // console.log(client.commands)
	}
}
let lastCachedInteraction = null;
const pendingInteractions = new Map();
client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;
	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

    audioPlayer.on('addqueue', async (interaction) => {
        lastCachedInteraction = interaction;
    });

    audioPlayer.once('skip', async (interaction) => {
        lastCachedInteraction = interaction || lastCachedInteraction;
        const channel = lastCachedInteraction.channel;
        if(!interaction?.deferred && !interaction?.replied && interaction?.editReply){
            interaction.editReply && await interaction.editReply({ embeds: [createNewEmbed()] });
            return;
        }
        lastCachedInteraction.followUp({ embeds: [createNewEmbed()] })
    });
	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
		}
	}
});

export {lastCachedInteraction}























