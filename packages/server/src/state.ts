import { AudioQueueItem } from '@discord-tool/shared';

export interface ServerState {
  connected: boolean;
  guildId: string | null;
  guildName: string | null;
  channelId: string | null;
  channelName: string | null;
  currentTrack: AudioQueueItem | null;
  queue: AudioQueueItem[];
  paused: boolean;
}

export const createInitialState = (): ServerState => ({
  connected: false,
  guildId: null,
  guildName: null,
  channelId: null,
  channelName: null,
  currentTrack: null,
  queue: [],
  paused: false,
});