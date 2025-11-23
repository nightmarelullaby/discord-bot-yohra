import { AudioPlayerStatus, createAudioPlayer, createAudioResource, NoSubscriberBehavior, StreamType } from "@discordjs/voice";
import EventEmitter from "events";
import fs from 'fs';
// import {lastCachedInteraction} from '../index.js';


export class CustomAudioPlayer extends EventEmitter {
    constructor(){
        if(typeof CustomAudioPlayer.instance === 'object'){
            return CustomAudioPlayer.instance
        }
        super();
        this.audioPlayer = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Pause,
            },
        })
        this.songs = [];
        this.currentPlaying = null;
        this.handleAudioPlayerEvents();
        CustomAudioPlayer.instance = this;
        return this;

    }

    get getAudioPlayer() {
        return this.audioPlayer;
    }

    get getAudioPlayerStatus() {
        return this.audioPlayer.state.status;
    }

    setConnection(connection){
        if(!this.connection){
            this.connection = connection
            this.connection.subscribe(this.audioPlayer);
        }
    }

    concatSong(song, interaction){
        const position = this.songs.length;
        this.songs.push({
            // path: song.path,
            position,
            title: song.title,
            stream: song?.stream
        })

        if(this.getAudioPlayerStatus === AudioPlayerStatus.Idle){
            this.currentPlaying = position;
            this._play(song);
        }
        return this.emit('addqueue', interaction);
    }

    _play(song){
        const playSong = this.songs.at(this.currentPlaying);
        const resource = createAudioResource(song.stream, {
            inputType: StreamType.OggOpus
        });
        this.audioPlayer.play(resource)
        return this.emit('playingsong', playSong.title);
    }

    next(interaction){
        this.currentPlaying += 1;
        let nextSong = this.songs.at(this.currentPlaying);
        let prevSong = this.songs.at(this.currentPlaying - 1);

        if(!nextSong) {
            this.currentPlaying -= 1;
            return this.emit('notnextsong', null);
        }

        this.audioPlayer.stop();
        this._play(nextSong, true)
        this.emit('skip', interaction);
        prevSong.stream.end();
        if (prevSong.stream && !prevSong.stream.destroyed) {
            prevSong.stream.destroy();
        }
    }

    getPlaylist(){
        return this.songs
    }

    handleAudioPlayerEvents(){
        this.getAudioPlayer.on('error', error => {
            console.error(`Error: ${error.message} with resource`);
        });

        this.getAudioPlayer.on(AudioPlayerStatus.Playing, async () => {
            // await interaction.editReply(`Reproduciendo canción: ${videoTitle}`);
            console.log('The audio player has started playing!');
        });

        this.getAudioPlayer.on(AudioPlayerStatus.Paused, () => {
            console.log('The audio player is paused');
        });

        this.getAudioPlayer.on(AudioPlayerStatus.AutoPaused, () => {
            console.log('The audio player is autoPaused');
        });

        this.getAudioPlayer.on(AudioPlayerStatus.Buffering, () => {
            console.log('The audio player is buffering');
        });

        this.getAudioPlayer.on(AudioPlayerStatus.Idle, () => {
            console.log('Not song playing...')
            this.audioPlayer.stop();
            this.next()

        });
    }
}
const audioPlayer = new CustomAudioPlayer;

export default audioPlayer
