import { ClearResponse } from '@discord-tool/shared';
import { ServerState } from '../state.js';

export function handleClear(state: ServerState): ClearResponse {
  state.queue = [];
  return { type: 'clear', success: true, message: 'Queue cleared' };
}