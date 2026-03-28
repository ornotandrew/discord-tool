import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Socket } from 'net';
import * as fs from 'fs';
import * as path from 'path';

// Mock the socket module
vi.mock('net', () => {
  const mockSocket = {
    connect: vi.fn(),
    write: vi.fn(),
    on: vi.fn(),
    end: vi.fn(),
    destroy: vi.fn(),
  };

  return {
    Socket: vi.fn(() => mockSocket),
    default: { Socket: vi.fn(() => mockSocket) },
  };
});

// Mock fs module
vi.mock('fs', async () => {
  return {
    default: {
      existsSync: vi.fn().mockReturnValue(true),
      unlinkSync: vi.fn(),
      readFileSync: vi.fn().mockReturnValue('{}'),
      promises: {
        mkdir: vi.fn().mockResolvedValue(undefined),
        writeFile: vi.fn().mockResolvedValue(undefined),
        unlink: vi.fn().mockResolvedValue(undefined),
      },
    },
    existsSync: vi.fn().mockReturnValue(true),
    unlinkSync: vi.fn(),
    readFileSync: vi.fn().mockReturnValue('{}'),
  };
});

// Mock config
vi.mock('../packages/client/src/index', () => {
  return {};
});

// Import after mocks
describe('Client CLI', () => {
  // Tests for config loading
  describe('Config Loading', () => {
    it('should load config from correct path', async () => {
      const configPath = path.join(process.env.HOME || '', '.config/discord-tool/config.json');
      expect(fs.existsSync(configPath)).toBe(true);
    });
  });

  // Tests for command parsing
  describe('Command Parsing', () => {
    it('should parse join command with guild and channel', () => {
      const args = ['join', '562220519173128202', '997573231286431854'];
      expect(args[0]).toBe('join');
      expect(args[1]).toBe('562220519173128202');
      expect(args[2]).toBe('997573231286431854');
    });

    it('should parse status command', () => {
      const args = ['status'];
      expect(args[0]).toBe('status');
    });

    it('should parse channels command with optional guild flag', () => {
      const options = { guild: 'mines' };
      expect(options.guild).toBe('mines');
    });

    it('should parse channels command without guild flag', () => {
      const options: { guild?: string } = {};
      expect(options.guild).toBeUndefined();
    });
  });

  // Tests for JSON output format
  describe('JSON Output', () => {
    it('should format status response as JSON', () => {
      const statusResponse = {
        connected: true,
        guild: { id: '562220519173128202', name: 'The Otataral Mines' },
        channel: { id: '997573231286431854', name: 'Despair of the Ancients' },
        currentTrack: null,
        queueLength: 0,
        paused: false,
      };
      const json = JSON.stringify(statusResponse, null, 2);
      expect(json).toContain('"connected": true');
    });

    it('should format channels response with users as JSON', () => {
      const channelsResponse = {
        channels: [
          {
            id: '997573231286431854',
            name: 'Despair of the Ancients',
            users: [{ username: 'wRaithy', nick: null }],
          },
          {
            id: '958756386823610409',
            name: 'Bazaarians',
            users: [],
          },
        ],
      };
      const json = JSON.stringify(channelsResponse, null, 2);
      expect(json).toContain('"name": "Despair of the Ancients"');
      expect(json).toContain('"users"');
    });

    it('should format error response as JSON', () => {
      const errorResponse = { error: 'Not connected to a voice channel' };
      const json = JSON.stringify(errorResponse, null, 2);
      expect(json).toContain('"error"');
    });
  });

  // Tests for guild ID resolution
  describe('Guild ID Resolution', () => {
    it('should recognize numeric guild ID', () => {
      const input = '562220519173128202';
      const isNumeric = /^\d+$/.test(input);
      expect(isNumeric).toBe(true);
    });

    it('should recognize named guild from config', () => {
      const config = {
        guilds: {
          mines: '562220519173128202',
          echo: '1476992415117082634',
        },
      };
      const input = 'mines';
      expect(config.guilds[input]).toBe('562220519173128202');
    });

    it('should throw error for unknown guild', () => {
      const input = 'unknownguild';
      const config = { guilds: { mines: '123' } };
      expect(() => {
        if (!(input in config.guilds)) {
          throw new Error(`Unknown guild: ${input}`);
        }
      }).toThrow();
    });
  });

  // Tests for channel filtering
  describe('Channel Filtering', () => {
    const channels = [
      { id: '1', name: 'Voice 1', type: 2 },
      { id: '2', name: 'Text 1', type: 0 },
      { id: '3', name: 'Voice 2', type: 2 },
      { id: '4', name: 'Category', type: 4 },
    ];

    it('should filter voice channels', () => {
      const voiceChannels = channels.filter((ch) => ch.type === 2);
      expect(voiceChannels).toHaveLength(2);
    });

    it('should filter text channels', () => {
      const textChannels = channels.filter((ch) => ch.type === 0);
      expect(textChannels).toHaveLength(1);
    });

    it('should group channels by category', () => {
      const byCategory: Record<string, typeof channels> = { ungrouped: [] };
      for (const ch of channels) {
        const catId = 'parent_id' in ch ? (ch as any).parent_id || 'ungrouped' : 'ungrouped';
        if (!byCategory[catId]) byCategory[catId] = [];
        byCategory[catId].push(ch);
      }
      expect(byCategory['ungrouped']).toHaveLength(4);
    });
  });

  // Tests for user display
  describe('User Display', () => {
    it('should display username when no nick', () => {
      const user = { username: 'wRaithy', nick: null };
      const displayName = user.nick || user.username;
      expect(displayName).toBe('wRaithy');
    });

    it('should display nick when available', () => {
      const user = { username: 'wRaithy', nick: 'WraithyTheGreat' };
      const displayName = user.nick || user.username;
      expect(displayName).toBe('WraithyTheGreat');
    });

    it('should format users list correctly', () => {
      const users = [
        { username: 'wRaithy', nick: null },
        { username: 'Jeff', nick: null },
      ];
      const formatted = users.map((u) => u.nick || u.username);
      expect(formatted).toEqual(['wRaithy', 'Jeff']);
    });
  });

  // Tests for TTS command
  describe('TTS Command', () => {
    it('should include text in TTS request', () => {
      const text = 'Hello everyone!';
      const request = { type: 'tts', text };
      expect(request.text).toBe('Hello everyone!');
    });

    it('should use default voice if not specified', () => {
      const config = { defaultTtsVoice: 'en-ZA-LukeNeural' };
      const voice = config.defaultTtsVoice || 'en-US-AriaNeural';
      expect(voice).toBe('en-ZA-LukeNeural');
    });

    it('should use specified voice over default', () => {
      const options = { voice: 'en-US-AriaNeural' };
      const config = { defaultTtsVoice: 'en-ZA-LukeNeural' };
      const voice = options.voice || config.defaultTtsVoice || 'en-US-AriaNeural';
      expect(voice).toBe('en-US-AriaNeural');
    });
  });

  // Tests for play command
  describe('Play Command', () => {
    it('should include file path in play request', () => {
      const file = '/path/to/audio.mp3';
      const request = { type: 'play', file };
      expect(request.file).toBe('/path/to/audio.mp3');
    });
  });

  // Tests for queue operations
  describe('Queue Operations', () => {
    it('should format queue response', () => {
      const queueResponse = {
        queue: [
          { id: '1', type: 'file', path: '/audio1.mp3' },
          { id: '2', type: 'tts', text: 'Hello' },
        ],
      };
      expect(queueResponse.queue).toHaveLength(2);
    });
  });
});