import { Writable } from 'stream';

/**
 * Collects all chunks from a readable stream into a single Buffer.
 * @param {import('stream').Readable} stream
 * @returns {Promise<Buffer>}
 */
function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

export {streamToBuffer}