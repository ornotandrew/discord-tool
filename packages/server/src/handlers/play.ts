import { PlayResponse } from '@discord-tool/shared';
import { ServerState } from '../state.js';
import * as fs from 'fs';
import { randomUUID } from 'crypto';
import { AudioQueueItem } from '@discord-tool/shared';

type PlayNextFunction = () => Promise<void>;

export function handlePlay(
  state: ServerState,
  file: string,
  playNext: PlayNextFunction
): PlayResponse | { type: 'error'; error: string } {
  if (!file) {
    return { type: 'error', error: 'Missing file path' };
  }

  if (!fs.existsSync(file)) {
    return { type: 'error', error: 'File not found' };
  }

  const item: AudioQueueItem = {
    id: randomUUID(),
    type: 'file',
    path: file,
  };

  state.queue.push(item);

  // Start playing if nothing is playing and connected
  if (!state.currentTrack) {
    playNext();
  }

  return {
    type: 'play',
    success: true,
    message: 'Added to queue',
    item,
  };
}