import { Command } from 'commander';
import { sendCommand } from '../socket.js';

export function registerLeaveCommand(program: Command): void {
  program
    .command('leave')
    .description('Leave the voice channel')
    .action(async () => {
      try {
        const result = await sendCommand({ type: 'leave' });
        console.log(JSON.stringify(result, null, 2));
      } catch (err: any) {
        console.error(JSON.stringify({ error: err.message }));
        process.exit(1);
      }
    });
}