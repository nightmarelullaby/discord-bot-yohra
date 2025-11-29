import { spawn } from 'child_process';
import { PassThrough } from 'stream';


/**
 * Converts an audio stream to Ogg/Opus format using FFmpeg.
 * It reads the FFmpeg path from the FFMPEG_PATH environment variable (set in Docker).
 * * @param {import('stream').Readable} inputStream The input audio stream.
 * @param {string} inputFormat The known input format (e.g., 'webm', 'mp4').
 * @returns {import('stream').Readable}
 */
function convertToOggOpus(inputStream, inputFormat) {
    const ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';

    if (!ffmpegPath) {
        throw new Error('FFMPEG_PATH environment variable is not set. Cannot run conversion.');
    }

    const outputStream = new PassThrough();

    const ffmpegArgs = [
        '-loglevel', 'error',
        '-f', inputFormat,
        '-i', 'pipe:0',
        '-acodec', 'libopus',
        '-ar', '48000',
        '-ac', '2',
        '-application', 'audio',
        '-f', 'ogg',
        'pipe:1'
    ];

    console.log(`Spawning FFmpeg with args: ${ffmpegArgs.join(' ')}`);

    const ffmpegProcess = spawn(ffmpegPath, ffmpegArgs);
    let ffmpegErrorOutput = '';

    ffmpegProcess.stderr.on('data', (data) => {
        const errorString = data.toString();
        ffmpegErrorOutput += errorString;

        if (errorString.toLowerCase().includes('error') && !outputStream.destroyed) {
            console.error(`FFmpeg STDERR: ${errorString.trim()}`);
        }
    });

    ffmpegProcess.on('close', (code) => {
        if (code !== 0) {
            console.error('--- FFmpeg Process Failed ---');
            console.error(`Command: ${ffmpegPath} ${ffmpegArgs.join(' ')}`);
            console.error(`Exit Code: ${code}`);
            console.error('--- FFmpeg Diagnostics (STDERR) ---');
            console.error(ffmpegErrorOutput);
            console.error('-----------------------------------');
            outputStream.emit('error', new Error(`FFmpeg process exited with code ${code}. Details:\n${ffmpegErrorOutput}`));
            outputStream.destroy();
        } else {
            console.log('FFmpeg process finished successfully.');
            outputStream.end();
        }
    });

    ffmpegProcess.on('error', (err) => {
        console.error(`Failed to start FFmpeg process: ${err.message}`);
        outputStream.emit('error', err);
        outputStream.destroy();
    });

    inputStream.pipe(ffmpegProcess.stdin);
    ffmpegProcess.stdout.pipe(outputStream);

    return outputStream;
}

export { convertToOggOpus };