import { SkipResponse } from '@discord-tool/shared';
import { ServerState } from '../state.js';

type AudioPlayer = {
  stop: () => void;
};

export function handleSkip(
  state: ServerState,
  audioPlayer: AudioPlayer | null
): SkipResponse | { type: 'error'; error: string } {
  if (state.currentTrack && audioPlayer) {
    audioPlayer.stop();
    return { type: 'skip', success: true, message: 'Skipped' };
  }

  return { type: 'error', error: 'Nothing playing' };
}