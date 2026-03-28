import { TtsResponse, AudioQueueItem } from '@discord-tool/shared';
import { ServerState } from '../state.js';
import { randomUUID } from 'crypto';

type PlayNextFunction = () => Promise<void>;

export function handleTts(
  state: ServerState,
  text: string,
  voice: string | undefined,
  playNext: PlayNextFunction
): TtsResponse | { type: 'error'; error: string } {
  if (!text) {
    return { type: 'error', error: 'Missing text' };
  }

  const item: AudioQueueItem = {
    id: randomUUID(),
    type: 'tts',
    text,
    voice: voice || 'en-US-AriaNeural',
  };

  state.queue.push(item);

  // Start playing if nothing is playing
  if (!state.currentTrack) {
    playNext();
  }

  return {
    type: 'tts',
    success: true,
    message: 'TTS queued',
    item,
  };
}