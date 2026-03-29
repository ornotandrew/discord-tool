import { PauseResponse } from '@discord-tool/shared';
import { ServerState } from '../state.js';

type AudioPlayer = {
  pause: () => void;
};

export function handlePause(
  state: ServerState,
  audioPlayer: AudioPlayer | null
): PauseResponse | { type: 'error'; error: string } {
  if (audioPlayer) {
    audioPlayer.pause();
    state.paused = true;
    return { type: 'pause', success: true, message: 'Paused' };
  }

  return { type: 'error', error: 'Not playing' };
}