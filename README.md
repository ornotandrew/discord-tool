# discord-tool

A Discord bot with voice channel audio playback and text-to-speech (TTS) capabilities. Built with Discord.js and uses a client-server architecture with Unix sockets for communication.

## Features

- **Voice Channel Join**: Join any voice channel in a Discord guild
- **Audio Playback**: Play local audio files (MP3, WAV, etc.)
- **Text-to-Speech**: Convert text to speech using Microsoft Edge TTS voices
- **Queue Management**: Queue multiple tracks, skip, pause, resume, clear
- **CLI Interface**: Simple command-line interface for all operations

## Prerequisites

- Node.js 20+
- npm or pnpm
- A Discord Bot Token
- A Discord server where you have permission to add bots and create voice channels

## Installation

```bash
# Clone or navigate to the project
cd /Users/andrew/.openclaw/workspace-andrew/discord-tool

# Install dependencies
npm install

# Build the project (optional, for production)
npm run build
```

## Configuration

Create a configuration file at `~/.config/discord-tool/config.json`:

```json
{
  "botToken": "YOUR_DISCORD_BOT_TOKEN_HERE",
  "guilds": {
    "echo": "123456789012345678",
    "mines": "987654321098765432"
  }
}
```

### Getting Your Bot Token

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to "Bot" and create a bot user
4. Copy the token (keep it secret!)
5. Add the bot to your server using the OAuth2 URL generator

### Getting Channel and Guild IDs

1. Enable Developer Mode in Discord (User Settings → Advanced → Developer Mode)
2. Right-click on a voice channel → "Copy Channel ID"
3. Right-click on a guild/server name → "Copy ID"

### Adding the Bot to Your Server

In the Discord Developer Portal:
1. Go to OAuth2 → URL Generator
2. Select scopes: `bot`
3. Select permissions: `Connect`, `Speak`, `View Channels`
4. Use the generated URL to invite the bot

## Usage

The CLI is located at `packages/client/src/index.ts`. You can run it with `npx tsx`:

### Join a Voice Channel

```bash
npx tsx packages/client/src/index.ts join <channel_id> -g <guild_id_or_name>
```

Example:
```bash
npx tsx packages/client/src/index.ts join 123456789012345678 -g echo
```

### Leave a Voice Channel

```bash
npx tsx packages/client/src/index.ts leave <guild_id_or_name>
```

### Play an Audio File

```bash
npx tsx packages/client/src/index.ts play <guild_id_or_name> <file_path>
```

Example:
```bash
npx tsx packages/client/src/index.ts play echo /path/to/song.mp3
```

### Text-to-Speech

```bash
npx tsx packages/client/src/index.ts tts <guild_id_or_name> "<text>" [-v <voice>]
```

Example:
```bash
npx tsx packages/client/src/index.ts tts echo "Hello everyone!"
npx tsx packages/client/src/index.ts tts echo "Hello with a different voice" -v en-GB-SoniaNeural
```

### Available TTS Voices

The default voice is `en-US-AriaNeural`. Other available voices include:

| Voice | Language |
|-------|----------|
| `en-US-AriaNeural` | English (US) - Female |
| `en-US-GuyNeural` | English (US) - Male |
| `en-GB-SoniaNeural` | English (UK) - Female |
| `en-GB-RyanNeural` | English (UK) - Male |
| `af-ZA-AdeleNeural` | Afrikaans - Female |
| `af-ZA-WillemNeural` | Afrikaans - Male |

Full list: https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/full

### Control Playback

```bash
# Get current status
npx tsx packages/client/src/index.ts status <guild_id_or_name>

# Show queue
npx tsx packages/client/src/index.ts queue <guild_id_or_name>

# Skip current track
npx tsx packages/client/src/index.ts skip <guild_id_or_name>

# Pause playback
npx tsx packages/client/src/index.ts pause <guild_id_or_name>

# Resume playback
npx tsx packages/client/src/index.ts resume <guild_id_or_name>

# Clear the queue
npx tsx packages/client/src/index.ts clear <guild_id_or_name>
```

### List Channels

```bash
# List all channels in a guild
npx tsx packages/client/src/index.ts channels <guild_id_or_name>

# Filter by type
npx tsx packages/client/src/index.ts channels <guild_id_or_name> -t voice
npx tsx packages/client/src/index.ts channels <guild_id_or_name> -t text
```

## Command Reference

| Command | Description | Arguments |
|---------|-------------|-----------|
| `join` | Join a voice channel | `<channel_id>`, `-g <guild>` |
| `leave` | Leave the voice channel | `<guild_id>` |
| `play` | Play an audio file | `<guild_id>`, `<file>` |
| `tts` | Text-to-speech | `<guild_id>`, `<text>`, `-v <voice>` |
| `status` | Get current status | `<guild_id>` |
| `queue` | Show current queue | `<guild_id>` |
| `skip` | Skip current track | `<guild_id>` |
| `pause` | Pause playback | `<guild_id>` |
| `resume` | Resume playback | `<guild_id>` |
| `clear` | Clear the queue | `<guild_id>` |
| `channels` | List guild channels | `<guild_id>`, `-t <type>` |

## Architecture

The tool uses a client-server architecture:

- **Server** (`packages/server/src/index.ts`): Runs as a background process, connects to Discord, plays audio
- **Client** (`packages/client/src/index.ts`): CLI tool that communicates with the server via Unix sockets

The server persists in the background after joining a channel, allowing multiple commands to be sent to the same session.

## Permissions Required

The bot needs the following Discord permissions:

- `VIEW_CHANNEL` - See voice channels
- `CONNECT` - Join voice channels
- `SPEAK` - Play audio in voice channels

## Troubleshooting

### Bot won't join
- Verify the bot has permission to join the channel
- Check that the channel ID is correct
- Ensure the guild ID is correct

### Audio not playing
- Check that the bot has the `SPEAK` permission
- Verify the audio file exists and is a supported format
- Check that the bot isn't muted or deafened

### TTS not working
- Ensure text is provided (not empty)
- Check that the voice name is valid

### Server not running
- Use `join` first to start the server
- Check that the Unix socket exists at `/tmp/discord-tool/guild-<guild_id>.sock`

## Development

```bash
# Run server in watch mode
npm run dev:server

# Run client in watch mode
npm run dev:client

# Build everything
npm run build
```

## License

MIT