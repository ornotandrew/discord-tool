import { ResumeResponse } from '@discord-tool/shared';
import { ServerState } from '../state.js';

type AudioPlayer = {
  unpause: () => void;
};

export function handleResume(
  state: ServerState,
  audioPlayer: AudioPlayer | null
): ResumeResponse | { type: 'error'; error: string } {
  if (audioPlayer) {
    audioPlayer.unpause();
    state.paused = false;
    return { type: 'resume', success: true, message: 'Resumed' };
  }

  return { type: 'error', error: 'Not playing' };
}