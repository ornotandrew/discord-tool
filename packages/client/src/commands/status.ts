import { Command } from 'commander';
import { sendCommand } from '../socket.js';

export function registerStatusCommand(program: Command): void {
  program
    .command('status')
    .description('Get current status')
    .action(async () => {
      try {
        const result = await sendCommand({ type: 'status' });
        console.log(JSON.stringify(result, null, 2));
      } catch (err: any) {
        console.error(JSON.stringify({ error: err.message }));
        process.exit(1);
      }
    });
}