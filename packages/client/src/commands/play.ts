import { Command } from 'commander';
import { sendCommand } from '../socket.js';

export function registerPlayCommand(program: Command): void {
  program
    .command('play')
    .description('Play an audio file')
    .argument('<file>', 'Audio file path')
    .action(async (file: string) => {
      try {
        const result = await sendCommand({ type: 'play', file });
        console.log(JSON.stringify(result, null, 2));
      } catch (err: any) {
        console.error(JSON.stringify({ error: err.message }));
        process.exit(1);
      }
    });
}