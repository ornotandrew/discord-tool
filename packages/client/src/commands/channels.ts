import { Command } from 'commander';
import { resolveGuildId, fetchGuildChannels, sendCommand } from '../socket.js';

export function registerChannelsCommand(program: Command): void {
  program
    .command('channels')
    .description('List all channels in a guild')
    .option('-g, --guild <guild_id>', 'Guild ID (or name from config). Uses connected guild if omitted.')
    .option('-t, --type <type>', 'Filter by channel type (text, voice, category)')
    .action(async (options: any) => {
      const inputGuildId = options.guild;
      try {
        let guildId = inputGuildId;
        
        // If no guild specified, try to get from current connection
        if (!guildId) {
          const status = await sendCommand({ type: 'status' });
          if (status.connected && status.guild?.id) {
            guildId = status.guild.id;
          } else {
            console.log(JSON.stringify({ error: 'Not connected. Specify a guild ID.' }));
            process.exit(1);
          }
        } else {
          guildId = resolveGuildId(guildId);
        }
        
        // Try to get voice channels with users from server first
        try {
          const status = await sendCommand({ type: 'status' });
          if (status.connected && status.guild?.id === guildId) {
            const result = await sendCommand({ type: 'guild-channels' });
            console.log(JSON.stringify(result, null, 2));
            return;
          }
        } catch (e) {
          // Server command failed, fall through to API
        }
        
        // Fall back to direct API call
        const channels = await fetchGuildChannels(guildId!);
        console.log(JSON.stringify({ channels }, null, 2));
      } catch (err: any) {
        console.error(JSON.stringify({ error: err.message }));
        process.exit(1);
      }
    });
}