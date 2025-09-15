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
const proxyAgent = ytdl.createProxyAgent({ uri: "http://45.159.216.250:80" },[{"domain":".youtube.com","expirationDate":1763069750,"hostOnly":false,"httpOnly":false,"name":"_gcl_au","path":"/","sameSite":"unspecified","secure":false,"session":false,"storeId":"0","value":"1.1.842574404.1755293750"},{"domain":".youtube.com","expirationDate":1792462226.661245,"hostOnly":false,"httpOnly":false,"name":"PREF","path":"/","sameSite":"unspecified","secure":true,"session":false,"storeId":"0","value":"tz=America.Caracas&f4=4000000&f7=18150&f6=40000000&f5=20000&repeat=NONE&autoplay=true&volume=8"},{"domain":".youtube.com","expirationDate":1792172363.818424,"hostOnly":false,"httpOnly":false,"name":"SID","path":"/","sameSite":"unspecified","secure":false,"session":false,"storeId":"0","value":"g.a0001AjhJrMOvQVaE4KoPIIK9_YL5Bsi2fgja2Al5PnzE0-EJvyagzFumbMGwSdVBRAaynJjEwACgYKAXUSARASFQHGX2MiXTsZZrWYCKY5UJzzT7MXMRoVAUF8yKqiKoHcW1W0uy3Y8BU7IXrt0076"},{"domain":".youtube.com","expirationDate":1792172363.818685,"hostOnly":false,"httpOnly":true,"name":"__Secure-1PSID","path":"/","sameSite":"unspecified","secure":true,"session":false,"storeId":"0","value":"g.a0001AjhJrMOvQVaE4KoPIIK9_YL5Bsi2fgja2Al5PnzE0-EJvyaWSPAEe03ZIuJIFJdrvPkFgACgYKAYESARASFQHGX2MiB87OyWvacXnfsB8WOpW0AhoVAUF8yKqivlkTWQ7T_p5APl2ktqTZ0076"},{"domain":".youtube.com","expirationDate":1792172363.818757,"hostOnly":false,"httpOnly":true,"name":"__Secure-3PSID","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"g.a0001AjhJrMOvQVaE4KoPIIK9_YL5Bsi2fgja2Al5PnzE0-EJvyacMXJwsiys5vC6CyQEju08AACgYKAegSARASFQHGX2MiOXpB52sKS6Pc7BAkqhXF-RoVAUF8yKpQuw55dbVehMohJdOnmDFF0076"},{"domain":".youtube.com","expirationDate":1792172363.818818,"hostOnly":false,"httpOnly":true,"name":"HSID","path":"/","sameSite":"unspecified","secure":false,"session":false,"storeId":"0","value":"AiMsbTVOMetFF4Aml"},{"domain":".youtube.com","expirationDate":1792172363.818875,"hostOnly":false,"httpOnly":true,"name":"SSID","path":"/","sameSite":"unspecified","secure":true,"session":false,"storeId":"0","value":"As38ljQHai_k7iUio"},{"domain":".youtube.com","expirationDate":1792172363.818932,"hostOnly":false,"httpOnly":false,"name":"APISID","path":"/","sameSite":"unspecified","secure":false,"session":false,"storeId":"0","value":"6ihRzfTU1ZTxKglm/A0tM6ivJl6mvZYEpe"},{"domain":".youtube.com","expirationDate":1792172363.818993,"hostOnly":false,"httpOnly":false,"name":"SAPISID","path":"/","sameSite":"unspecified","secure":true,"session":false,"storeId":"0","value":"JROxccu5yIlrsJas/Al5XwQ3WnAAI6uOtr"},{"domain":".youtube.com","expirationDate":1792172363.819062,"hostOnly":false,"httpOnly":false,"name":"__Secure-1PAPISID","path":"/","sameSite":"unspecified","secure":true,"session":false,"storeId":"0","value":"JROxccu5yIlrsJas/Al5XwQ3WnAAI6uOtr"},{"domain":".youtube.com","expirationDate":1792172363.819135,"hostOnly":false,"httpOnly":false,"name":"__Secure-3PAPISID","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"JROxccu5yIlrsJas/Al5XwQ3WnAAI6uOtr"},{"domain":".youtube.com","expirationDate":1773634885.401432,"hostOnly":false,"httpOnly":true,"name":"NID","path":"/","sameSite":"unspecified","secure":true,"session":false,"storeId":"0","value":"525=MyC-sVnKTe0bBzK0Tb4WSjAl1u2dh08hIZPO9ekb-ZPKDuJZRiXh4Vw6FT_17dtv9gQQD49ZhnRPYY20sojwXC5qQi-Rlx_2MY7u3PJZ7rpZn5GaoohdxmwDLuPrZphPTWgdyOe99fa_CeVhSrsmzOHlO1DTJYTzP02sJz5wAEOyS2XVAk3bNPbuyVeYGaRrwjcBGerngS7SEIs8jRnI-fEvpw"},{"domain":".youtube.com","expirationDate":1792461402.682561,"hostOnly":false,"httpOnly":true,"name":"LOGIN_INFO","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"AFmmF2swRgIhAOqGob3hUr6lcbCs_A_UojAw9C7t1JCAMUPteaFoY2_BAiEAi0QmfA0WA3C-OvxGmVlg8dpMmgtKsjNNd6EI9Rnh7Xw:QUQ3MjNmeXYzMVNscThpOGNsTjNTZmFpZU9aUjZxMXhPOEthaXRrNHRFOFpjczNJMEFKVFNSR1U4OU1JTnhIS25WYU5qb1doUkhpRW9BLXBCTUV2VnJJZXF2UlZvRzlqTXV3SnBnNkExUGpCeW9BeUllSDdUa1cxelN3QUtEc1hZUk4tT1dvSXlNd2tRUkJRTGNHYnR6bzNyd3YyOEQxeDZB"},{"domain":".youtube.com","expirationDate":1789438165.951607,"hostOnly":false,"httpOnly":true,"name":"__Secure-1PSIDTS","path":"/","sameSite":"unspecified","secure":true,"session":false,"storeId":"0","value":"sidts-CjUBmkD5SzESmXlG7DrEG9air-DT_Pcy7lOJ3DiexMPBTGJpeMCp6yno7zAp6-F1r2YsnEz94hAA"},{"domain":".youtube.com","expirationDate":1789438165.951773,"hostOnly":false,"httpOnly":true,"name":"__Secure-3PSIDTS","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"sidts-CjUBmkD5SzESmXlG7DrEG9air-DT_Pcy7lOJ3DiexMPBTGJpeMCp6yno7zAp6-F1r2YsnEz94hAA"},{"domain":".youtube.com","expirationDate":1789438257.607542,"hostOnly":false,"httpOnly":false,"name":"SIDCC","path":"/","sameSite":"unspecified","secure":false,"session":false,"storeId":"0","value":"AKEyXzXCzF4yrEONXoJZk_NzHHhGGTJJ8a6ZITnFbIMvPleUfhx9YFVgpwG9X1iOIOHHkKAZp5w"},{"domain":".youtube.com","expirationDate":1789438257.607683,"hostOnly":false,"httpOnly":true,"name":"__Secure-1PSIDCC","path":"/","sameSite":"unspecified","secure":true,"session":false,"storeId":"0","value":"AKEyXzX4wW2QUG5aRZUMo1DCl7RkY1kkcnk06lYD4BxTxOH-vP1tr2a1g8brgSqvdevSZ1ghRbs"},{"domain":".youtube.com","expirationDate":1789438257.607738,"hostOnly":false,"httpOnly":true,"name":"__Secure-3PSIDCC","path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"AKEyXzWQx2UKqzUMF1GiUFhI4aeEpCOPBn0J3rd3c0vcYRI5TXTk7HR1x_S-ppSVxkSR-9qrSGJ6"},{"domain":".youtube.com","expirationDate":1773454225.160905,"hostOnly":false,"httpOnly":true,"name":"VISITOR_INFO1_LIVE","partitionKey":{"hasCrossSiteAncestor":false,"topLevelSite":"https://youtube.com"},"path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"rwGXRtO2Kbs"},{"domain":".youtube.com","expirationDate":1773454225.1611,"hostOnly":false,"httpOnly":true,"name":"VISITOR_PRIVACY_METADATA","partitionKey":{"hasCrossSiteAncestor":false,"topLevelSite":"https://youtube.com"},"path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"CgJWRRIEGgAgLQ%3D%3D"},{"domain":".youtube.com","hostOnly":false,"httpOnly":true,"name":"YSC","partitionKey":{"hasCrossSiteAncestor":false,"topLevelSite":"https://youtube.com"},"path":"/","sameSite":"no_restriction","secure":true,"session":true,"storeId":"0","value":"V0cXwPCfgUs"},{"domain":".youtube.com","expirationDate":1773436169.63934,"hostOnly":false,"httpOnly":true,"name":"__Secure-ROLLOUT_TOKEN","partitionKey":{"hasCrossSiteAncestor":false,"topLevelSite":"https://youtube.com"},"path":"/","sameSite":"no_restriction","secure":true,"session":false,"storeId":"0","value":"CIikvujpsKLtMRC24tyWrqSOAxj01rbplNmPAw%3D%3D"}]);

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