import { Command } from 'commander';
import { loadConfig } from '@discord-tool/shared';
import { resolveGuildId, fetchGuildChannels, ensureServerRunning, sendCommand } from '../socket.js';

export function registerJoinCommand(program: Command): void {
  program
    .command('join')
    .description('Join a voice channel')
    .argument('<guild_id>', 'Guild ID (or name from config)')
    .argument('<channel_id>', 'Voice channel ID')
    .action(async (guildId: string, channelId: string) => {
      try {
        loadConfig();
        guildId = resolveGuildId(guildId);  // Resolve name to ID
        
        // Resolve channel name to ID if needed
        if (!/^\d+$/.test(channelId)) {
          const channels = await fetchGuildChannels(guildId);
          const channel = channels.find((ch: any) => 
            ch.name.toLowerCase() === channelId.toLowerCase() && ch.type === 2
          );
          if (!channel) {
            console.error(`Channel "${channelId}" not found in guild. Use numeric ID or exact name.`);
            process.exit(1);
          }
          channelId = channel.id;
          console.log(`[Client] Resolved "${channelId}" to channel ID ${channelId}`);
        }
        
        await ensureServerRunning(guildId, channelId);
        
        // Server socket only exists after voice connection is ready, so no extra wait needed
        const status = await sendCommand({ type: 'status' });
        console.log(JSON.stringify(status, null, 2));
        
        // Give the child process time to stabilize before exiting
        // Use setImmediate to ensure all async operations are flushed
        await new Promise(resolve => setTimeout(resolve, 1000));
        process.exit(0);
      } catch (err: any) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });
}