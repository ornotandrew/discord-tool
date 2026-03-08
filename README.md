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
- npm
- A Discord Bot Token
- A Discord server where you have permission to add bots and create voice channels

## Installation

```bash
# Navigate to the project
cd /path/to/discord-tool

# Install dependencies
npm install

# Build the project (optional, for production)
npm run build

# Link the CLI to your PATH (required for `discord-tool` command)
npm link

# Link the CLI for convenient usage (run from project root)
npm link
```

After `npm link`, you can use `discord-tool` directly from the command line instead of `npx tsx packages/client/src/index.ts`.

## Configuration

Create a configuration file at `~/.config/discord-tool/config.json`:

```json
{
  "botToken": "YOUR_DISCORD_BOT_TOKEN_HERE",
  "guilds": {
    "my-guild": "123456789012345678",
    "other-guild": "987654321098765432"
  },
  "defaultTtsVoice": "<voice-id>"
}
```

### Configuration Options

| Option | Required | Description |
|--------|----------|-------------|
| `botToken` | Yes | Your Discord bot token |
| `guilds` | No | Named guilds for convenience (use names instead of IDs in commands) |
| `defaultTtsVoice` | No | Default voice for TTS. See [available voices](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/rest-text-to-speech). |

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

After `npm link`, use the CLI directly. Otherwise, run with `npx tsx packages/client/src/index.ts <command>`.

### Join a Voice Channel

```bash
# Using guild name from config
discord-tool join <guild> <channel>

# Example using named guild
discord-tool join my-guild 123456789012345678

# Using guild ID directly
discord-tool join 1476992415117082634 123456789012345678
```

### Leave a Voice Channel

```bash
discord-tool leave
```

### Play an Audio File

```bash
discord-tool play <file_path>

# Example
discord-tool play /path/to/song.mp3
```

### Text-to-Speech

```bash
discord-tool tts "<text>" [-v <voice>]

# Using default voice from config
discord-tool tts "Hello everyone!"

# Using a custom voice
discord-tool tts "Hello with a different voice" -v <voice-id>
```

### List Available TTS Voices

```bash
# Show all voices grouped by locale
discord-tool voices

# Filter by language
discord-tool voices --lang en

# Filter by gender
discord-tool voices --gender female

# Show full flat list
discord-tool voices --full
```

### Control Playback

```bash
# Get current status
discord-tool status

# Show queue
discord-tool queue

# Skip current track
discord-tool skip

# Pause playback
discord-tool pause

# Resume playback
discord-tool resume

# Clear the queue
discord-tool clear
```

### List Channels

```bash
# List all channels in a guild
discord-tool channels <guild>

# Filter by type
discord-tool channels <guild> --type voice
discord-tool channels <guild> --type text
```

## Command Reference

| Command | Arguments | Description |
|---------|-----------|-------------|
| `join` | `<guild>` `<channel>` | Join a voice channel |
| `leave` | - | Leave the voice channel and stop server |
| `play` | `<file>` | Play an audio file |
| `tts` | `<text>` `[-v <voice>]` | Generate and play TTS |
| `status` | - | Show current connection status |
| `queue` | - | Show audio queue |
| `skip` | - | Skip current track |
| `pause` | - | Pause playback |
| `resume` | - | Resume playback |
| `clear` | - | Clear the queue |
| `channels` | `<guild>` `[-t <type>]` | List channels in guild |
| `voices` | - | List available TTS voices |

## Permissions Required

The bot needs the following Discord permissions:

- **View Channel** - See voice channels in the server
- **Connect** - Join voice channels
- **Speak** - Play audio in voice channels

## Examples

### Join and Play TTS

```bash
# First, find a voice channel ID by listing channels
discord-tool channels my-guild

# Join the voice channel
discord-tool join my-guild 123456789012345678

# Play TTS using default voice from config
discord-tool tts "Hello from the bot!"

# Play TTS with a specific voice
discord-tool tts "Hello with a different voice" -v <voice-id>
```

### Using Custom Voices

```bash
# List available English voices
discord-tool voices --lang en

# Use a specific voice
discord-tool tts "Speaking in UK English" -v en-GB-RyanNeural

# Use Afrikaans voice
discord-tool tts "Hallo van die bot!" -v af-ZA-AdeleNeural
```

## Architecture

The tool uses a client-server architecture:

- **Server** (`packages/server/src/index.ts`): Runs as a background process, connects to Discord, plays audio
- **Client** (`packages/client/src/index.ts`): CLI tool that communicates with the server via Unix sockets

The server persists in the background after joining a channel, allowing multiple commands to be sent to the same session.

## Development

```bash
# Run server in watch mode
npm run dev:server

# Run client in watch mode
npm run dev:client

# Build everything
npm run build
```

## Troubleshooting

### Bot won't join
- Verify the bot has permission to join the channel
- Check that the channel ID is correct
- Ensure the guild ID or name is correct

### Audio not playing
- Check that the bot has the `SPEAK` permission
- Verify the audio file exists and is a supported format
- Check that the bot isn't muted or deafened

### TTS not working
- Ensure text is provided (not empty)
- Check that the voice name is valid (use `discord-tool voices` to list available voices)

### Server not running
- Use `join` first to start the server
- Check that the Unix socket exists at `/tmp/discord-tool.sock`

## License

MIT
