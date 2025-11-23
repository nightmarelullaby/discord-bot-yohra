import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import { PassThrough } from 'stream';

ffmpeg.setFfmpegPath(ffmpegPath);

function convertToOggOpus(mp3Stream, inputFormat = 'webm') {
   const outputStream = new PassThrough();

  ffmpeg()
    .input(mp3Stream)
    // .inputFormat(inputFormat)
    .audioCodec('libopus')
    .format('ogg') // use 'ogg' for Discord compatibility
    .outputOptions([
      '-ar 48000',
      '-ac 2',
      '-application audio'
    ])
    .on('start', cmd => console.log('FFmpeg started:', cmd))
    .on('error', err => {
      console.error('FFmpeg error:', err);
      outputStream.destroy(err);
    })
    .on('end', () => {
      console.log('FFmpeg finished');
    })
    .pipe(outputStream, { end: true });

  return outputStream;

}

export {
    convertToOggOpus
};