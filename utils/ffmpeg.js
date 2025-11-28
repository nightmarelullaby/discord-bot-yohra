import { spawn } from 'child_process';
import { PassThrough } from 'stream';
// Removed os, pathCommand, and the use of 'where'/'which' as we rely on ENV variable

/**
 * Converts an audio stream to Ogg/Opus format using FFmpeg.
 * It reads the FFmpeg path from the FFMPEG_PATH environment variable (set in Docker).
 * * @param {import('stream').Readable} inputStream The input audio stream.
 * @param {string} inputFormat The known input format (e.g., 'webm', 'mp4').
 * @returns {import('stream').Readable} The output PassThrough stream containing Ogg/Opus data.
 */
function convertToOggOpus(inputStream, inputFormat) {
    // Determine the FFmpeg path from environment variable (CRITICAL CHANGE)
    // We trust the path set in the Dockerfile (ENV FFMPEG_PATH=/usr/bin/ffmpeg)
    const ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';

    if (!ffmpegPath) {
        throw new Error('FFMPEG_PATH environment variable is not set. Cannot run conversion.');
    }

    // 1. Create a PassThrough stream (the placeholder for the output)
    const outputStream = new PassThrough();

    // The arguments array MUST include the -f flag to specify input format
    const ffmpegArgs = [
        '-f', inputFormat,
        '-i', 'pipe:0',
        '-probesize', '32',
        '-analyzeduration', '0',
        '-preset', 'veryfast',
        // Output Codec Settings
        '-acodec', 'libopus',
        '-ar', '48000',
        '-ac', '2',
        '-application', 'audio',
        // Output Format and Pipe Target
        '-f', 'ogg',
        'pipe:1'
    ];

    console.log(`Spawning FFmpeg with args: ${ffmpegArgs.join(' ')}`);

    // 2. Spawn the FFmpeg process immediately (Removed asynchronous path finding)
    const ffmpegProcess = spawn(ffmpegPath, ffmpegArgs);

    // Variable to capture all FFmpeg error output (CRITICAL for debugging!)
    let ffmpegErrorOutput = '';

    // 3. Capture FFmpeg's error messages from stderr
    ffmpegProcess.stderr.on('data', (data) => {
        const errorString = data.toString();
        ffmpegErrorOutput += errorString;

        // Optional check for immediate "error" keywords (less critical, but useful)
        if (errorString.toLowerCase().includes('error') && !outputStream.destroyed) {
            console.error(`FFmpeg STDERR: ${errorString.trim()}`);
        }
    });

    // 4. Handle process exit
    ffmpegProcess.on('close', (code) => {
        if (code !== 0) {
            // The process exited with an error code (code 1)
            console.error('--- FFmpeg Process Failed ---');
            console.error(`Command: ${ffmpegPath} ${ffmpegArgs.join(' ')}`);
            console.error(`Exit Code: ${code}`);
            console.error('--- FFmpeg Diagnostics (STDERR) ---');
            console.error(ffmpegErrorOutput);
            console.error('-----------------------------------');

            // Emit the detailed error on the output stream
            outputStream.emit('error', new Error(`FFmpeg process exited with code ${code}. Details:\n${ffmpegErrorOutput}`));
            outputStream.destroy(); // Ensure output stream is closed/destroyed
        } else {
            console.log('FFmpeg process finished successfully.');
            // Signal the output stream is finished
            outputStream.end();
        }
    });

    // 5. Handle stream errors (e.g., if FFmpeg fails to start or stream breaks)
    ffmpegProcess.on('error', (err) => {
        console.error(`Failed to start FFmpeg process: ${err.message}`);
        outputStream.emit('error', err);
        outputStream.destroy();
    });

    // 6. Connect the streams: Input -> ffmpeg -> PassThrough (outputStream)
    inputStream.pipe(ffmpegProcess.stdin);
    ffmpegProcess.stdout.pipe(outputStream);

    // Return the output stream immediately
    return outputStream;
}

// Since the original file used 'export' and 'module.exports',
// I'll stick to a common Node.js pattern (module.exports) for safety.
export { convertToOggOpus };