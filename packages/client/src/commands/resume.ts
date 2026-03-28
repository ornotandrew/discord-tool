import { Command } from 'commander';
import { sendCommand } from '../socket.js';

export function registerResumeCommand(program: Command): void {
  program
    .command('resume')
    .description('Resume playback')
    .action(async () => {
      try {
        const result = await sendCommand({ type: 'resume' });
        console.log(JSON.stringify(result, null, 2));
      } catch (err: any) {
        console.error(JSON.stringify({ error: err.message }));
        process.exit(1);
      }
    });
}