import { Command } from 'commander';
import { loadConfig } from '@discord-tool/shared';
import { sendCommand } from '../socket.js';

export function registerTtsCommand(program: Command): void {
  program
    .command('tts')
    .description('Generate and play TTS')
    .argument('<text>', 'Text to speak')
    .option('-v, --voice <voice>', 'Voice to use')
    .action(async (text: string, options: any) => {
      try {
        const config = loadConfig();
        const result = await sendCommand({ 
          type: 'tts', 
          text,
          voice: options.voice || config.defaultTtsVoice || 'en-US-AriaNeural'
        });
        console.log(JSON.stringify(result, null, 2));
      } catch (err: any) {
        console.error(JSON.stringify({ error: err.message }));
        process.exit(1);
      }
    });
}