import { AudioPlayerStatus, createAudioPlayer, createAudioResource, demuxProbe, entersState, joinVoiceChannel, NoSubscriberBehavior, StreamType, VoiceConnectionStatus } from '@discordjs/voice';
import { SlashCommandBuilder } from 'discord.js';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import fs from 'fs';
import ytdl from '@distube/ytdl-core';

const __dirname = import.meta.dirname;
import play from 'play-dl';
import { createReadStream } from 'node:fs';
import audioPlayer from '../../entity/audioPlayer.js';
import { convertMp3ToOggOpus } from '../../utils/ffmpeg.js';
import { createNewEmbed } from '../../utils/actions.js';


export default {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Plays an audio from youtube.')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('URL of the video')
                .setRequired(true)
            )
            ,
	async execute(interaction) {
        const __dirname = import.meta.dirname;
        const url = interaction.options.getString('url') ?? 'No reason provided';
        let connection = joinVoiceChannel({
            channelId: interaction.member.voice.channel.id,
            guildId: interaction.guildId,
            adapterCreator: interaction.channel.guild.voiceAdapterCreator // Corrected to guild.voiceAdapterCreator
        });

        audioPlayer.setConnection(connection);
        await interaction.deferReply();
        const videoURL = url;
        const info = await ytdl.getInfo(videoURL);
        const videoTitle = info.videoDetails.title.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_'); // Sanitize title for filename
        const musicPath = path.join(__dirname, `../../songs/${videoTitle}.mp3`)

        // const outputStream = fs.WriteStream(musicPath)
        const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
        const highestaudioFormat = ytdl.chooseFormat(audioFormats, { quality: 'highestaudio' });
        const audioStream = ytdl(videoURL,
            {
                format: highestaudioFormat,
                highWaterMark: 1 << 25
            }
        )
        const oggOpusStream = convertMp3ToOggOpus(audioStream, highestaudioFormat.container)

        audioPlayer.concatSong({
            stream: oggOpusStream,
            path: musicPath,
            title: info.videoDetails.title
        }, interaction)
        await interaction.editReply({ embeds: [createNewEmbed()] });

	},
};