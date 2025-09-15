import { SlashCommandBuilder } from 'discord.js';
import audioPlayer from '../../entity/audioPlayer.js';
import { createNewEmbed } from '../../utils/actions.js';

export default {
	data: new SlashCommandBuilder()
		.setName('next')
		.setDescription('Plays the next song in the queue'),
	async execute(interaction) {
		await interaction.deferReply();
        audioPlayer.next(interaction)
	},
};