import { Command } from 'commander';
import { sendCommand } from '../socket.js';

export function registerPauseCommand(program: Command): void {
  program
    .command('pause')
    .description('Pause playback')
    .action(async () => {
      try {
        const result = await sendCommand({ type: 'pause' });
        console.log(JSON.stringify(result, null, 2));
      } catch (err: any) {
        console.error(JSON.stringify({ error: err.message }));
        process.exit(1);
      }
    });
}