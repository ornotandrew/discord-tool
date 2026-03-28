import { LeaveResponse } from '@discord-tool/shared/types.js';
import { ServerState } from '../state.js';

export function handleLeave(state: ServerState): LeaveResponse {
  return {
    type: 'leave',
    success: true,
    message: 'Left channel',
  };
}