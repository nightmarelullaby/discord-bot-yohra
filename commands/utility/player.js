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
import { convertToOggOpus } from '../../utils/ffmpeg.js';
import { createNewEmbed } from '../../utils/actions.js';

import { spawn } from 'node:child_process';
import { streamToBuffer } from '../../utils/streamBuffer.js';
import { Readable } from 'node:stream';

function getDiscordAudioStream(url) {
  const ytdlp = runYtDlp(url, [
    '-o', '-',
    '-f', 'bestaudio[ext=webm]',
    '--extract-audio',
    '--no-progress',
    '--quiet',
    url
    ]);

  return convertToOggOpus(ytdlp.stdout, 'webm');
}
function getVideoInfo(url) {
  return new Promise((resolve, reject) => {
    const ls = runYtDlp(url, ['--print-json', '-q', '--skip-download']);
    let buffer = '';

    ls.stdout.on('data', async (data) => {
        buffer += data.toString();

        // Split into lines
        let lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete line

        for (const line of lines) {
            if (line.trim()) {
            try {
                const obj = JSON.parse(line);
                return resolve(obj);

            } catch (err) {
                console.error('Invalid JSON line:', line);
                reject(err);
            }
            }
        }
      })
    });
}

function runYtDlp(url, args) {
  return spawn('yt-dlp', args.concat([url]));
}

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

        await interaction.deferReply();
        const oggOpusStream = await getDiscordAudioStream(url);

        let connection = joinVoiceChannel({
            channelId: interaction.member.voice.channel.id,
            guildId: interaction.guildId,
            adapterCreator: interaction.channel.guild.voiceAdapterCreator // Corrected to guild.voiceAdapterCreator
        });

        audioPlayer.setConnection(connection);
        const videoURL = url;

        const info = await getVideoInfo(videoURL);
        const videoTitle = info.title.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_'); // Sanitize title for filename
        // const musicPath = path.join(__dirname, `../../songs/${videoTitle}.mp3`)

        audioPlayer.concatSong({
            stream: oggOpusStream,
            // path: musicPath,
            title: videoTitle
        }, interaction)
        console.log(audioPlayer.getPlaylist())
        await interaction.editReply({ embeds: [createNewEmbed()] });

	},
};