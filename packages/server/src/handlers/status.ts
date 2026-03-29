import { StatusResponse } from '@discord-tool/shared';
import { ServerState } from '../state.js';

export function handleStatus(state: ServerState): StatusResponse {
  return {
    type: 'status',
    connected: state.connected,
    guild: state.guildId
      ? {
          id: state.guildId,
          name: state.guildName,
        }
      : undefined,
    channel: state.channelId
      ? {
          id: state.channelId,
          name: state.channelName,
        }
      : undefined,
    currentTrack: state.currentTrack,
    queueLength: state.queue.length,
    paused: state.paused,
  };
}