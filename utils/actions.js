import { EmbedBuilder } from 'discord.js';
import audioPlayer from '../entity/audioPlayer.js';

function createNewEmbed(){
    const exampleEmbed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('Lista de reproducción')
        .setAuthor({ name: 'YoRHa No. 2 Type B', iconURL: 'https://i.pinimg.com/736x/59/e8/8f/59e88fdabc7229772af1fd781e619249.jpg', url: 'https://i.pinimg.com/736x/59/e8/8f/59e88fdabc7229772af1fd781e619249.jpg' })
        .addFields(
            audioPlayer.getPlaylist().map((song, index) => ({
                name: ``,
                value: `**#${song.position}** — ${audioPlayer.currentPlaying === index ? '🎶' : ''} ${song.title}`,
                inline: false
            }))
        )

        return exampleEmbed
}

export {createNewEmbed}