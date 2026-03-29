import { QueueResponse } from '@discord-tool/shared';
import { ServerState } from '../state.js';

export function handleQueue(state: ServerState): QueueResponse {
  return {
    type: 'queue',
    queue: state.queue,
  };
}