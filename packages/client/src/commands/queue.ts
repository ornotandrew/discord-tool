import { Command } from 'commander';
import { sendCommand } from '../socket.js';

export function registerQueueCommand(program: Command): void {
  program
    .command('queue')
    .description('Show current queue')
    .action(async () => {
      try {
        const result = await sendCommand({ type: 'queue' });
        console.log(JSON.stringify(result, null, 2));
      } catch (err: any) {
        console.error(JSON.stringify({ error: err.message }));
        process.exit(1);
      }
    });
}