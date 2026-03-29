import { Command } from 'commander';
import { sendCommand } from '../socket.js';

export function registerClearCommand(program: Command): void {
  program
    .command('clear')
    .description('Clear the queue')
    .action(async () => {
      try {
        const result = await sendCommand({ type: 'clear' });
        console.log(JSON.stringify(result, null, 2));
      } catch (err: any) {
        console.error(JSON.stringify({ error: err.message }));
        process.exit(1);
      }
    });
}