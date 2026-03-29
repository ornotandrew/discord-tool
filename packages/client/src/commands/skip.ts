import { Command } from 'commander';
import { sendCommand } from '../socket.js';

export function registerSkipCommand(program: Command): void {
  program
    .command('skip')
    .description('Skip current track')
    .action(async () => {
      try {
        const result = await sendCommand({ type: 'skip' });
        console.log(JSON.stringify(result, null, 2));
      } catch (err: any) {
        console.error(JSON.stringify({ error: err.message }));
        process.exit(1);
      }
    });
}