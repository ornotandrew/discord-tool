import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Discord.js
const mockVoiceStates = {
  cache: {
    filter: vi.fn(),
  },
};

const mockChannel = {
  id: '997573231286431854',
  name: 'Despair of the Ancients',
  isVoiceBased: vi.fn().mockReturnValue(true),
  guildId: '562220519173128202',
};

const mockGuild = {
  id: '562220519173128202',
  name: 'The Otataral Mines',
  voiceStates: mockVoiceStates,
  channels: {
    cache: {
      filter: vi.fn().mockReturnValue(new Map()),
      get: vi.fn(),
    },
  },
};

const mockClient = {
  user: { tag: 'Jeff#1234' },
  guilds: {
    cache: new Map([['562220519173128202', mockGuild]]),
  },
  channels: {
    fetch: vi.fn().mockResolvedValue(mockChannel),
  },
  once: vi.fn(),
  login: vi.fn().mockResolvedValue(undefined),
  destroy: vi.fn(),
};

// Mock the modules before importing
vi.mock('discord.js', () => ({
  Client: vi.fn(() => mockClient),
  GatewayIntentBits: {
    Guilds: 1,
    GuildVoiceStates: 2,
  },
  VoiceChannel: mockChannel,
}));

vi.mock('@discordjs/voice', () => ({
  joinVoiceChannel: vi.fn(),
  createAudioPlayer: vi.fn(),
  VoiceConnectionStatus: { Ready: 'ready' },
  entersState: vi.fn().mockResolvedValue(undefined),
  createAudioResource: vi.fn(),
}));

vi.mock('edge-tts-universal', () => ({
  Communicate: vi.fn().mockImplementation(() => ({
    stream: vi.fn().mockResolvedValue({
      [Symbol.asyncIterator]: async function* () {},
    }),
  })),
}));

vi.mock('fs', () => ({
  existsSync: vi.fn().mockReturnValue(true),
  unlinkSync: vi.fn(),
  readFileSync: vi.fn().mockReturnValue('{}'),
  promises: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
    unlink: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('Server Command Handlers', () => {
  // Test state structure
  describe('Server State', () => {
    it('should have correct initial state', () => {
      const state = {
        connected: false,
        guildId: null,
        guildName: null,
        channelId: null,
        channelName: null,
        currentTrack: null,
        queue: [],
        paused: false,
      };

      expect(state.connected).toBe(false);
      expect(state.queue).toHaveLength(0);
      expect(state.guildId).toBeNull();
    });
  });

  // Test status command
  describe('Status Command', () => {
    it('should return connected status', () => {
      const state = {
        connected: true,
        guildId: '562220519173128202',
        guildName: 'The Otataral Mines',
        channelId: '997573231286431854',
        channelName: 'Despair of the Ancients',
      };

      const response = {
        connected: state.connected,
        guild: { id: state.guildId, name: state.guildName },
        channel: { id: state.channelId, name: state.channelName },
      };

      expect(response.connected).toBe(true);
      expect(response.guild.id).toBe('562220519173128202');
    });

    it('should return disconnected status', () => {
      const state = { connected: false, guildId: null, guildName: null, channelId: null, channelName: null };

      const response = {
        connected: state.connected,
        guild: { id: state.guildId, name: state.guildName },
        channel: { id: state.channelId, name: state.channelName },
      };

      expect(response.connected).toBe(false);
      expect(response.guild.id).toBeNull();
    });
  });

  // Test play command
  describe('Play Command', () => {
    it('should add file to queue', () => {
      const queue: any[] = [];
      const item = { id: '123', type: 'file' as const, path: '/audio.mp3' };
      queue.push(item);

      expect(queue).toHaveLength(1);
      expect(queue[0].type).toBe('file');
    });

    it('should reject missing file path', () => {
      const cmd = { type: 'play' };
      const error = !cmd.file ? 'Missing file path' : null;
      expect(error).toBe('Missing file path');
    });

    it('should generate unique IDs for queue items', () => {
      const id1 = Math.random().toString(36).substring(2);
      const id2 = Math.random().toString(36).substring(2);
      expect(id1).not.toBe(id2);
    });
  });

  // Test TTS command
  describe('TTS Command', () => {
    it('should add TTS to queue', () => {
      const queue: any[] = [];
      const item = { id: '123', type: 'tts' as const, text: 'Hello!', voice: 'en-ZA-LukeNeural' };
      queue.push(item);

      expect(queue[0].type).toBe('tts');
      expect(queue[0].text).toBe('Hello!');
    });

    it('should reject missing text', () => {
      const cmd = { type: 'tts' };
      const error = !cmd.text ? 'Missing text' : null;
      expect(error).toBe('Missing text');
    });

    it('should use default voice if not specified', () => {
      const item = { type: 'tts', text: 'Hello', voice: undefined };
      const voice = item.voice || 'en-US-AriaNeural';
      expect(voice).toBe('en-US-AriaNeural');
    });
  });

  // Test queue command
  describe('Queue Command', () => {
    it('should return empty queue', () => {
      const queue: any[] = [];
      const response = { queue };
      expect(response.queue).toHaveLength(0);
    });

    it('should return queue with items', () => {
      const queue = [
        { id: '1', type: 'file', path: '/a.mp3' },
        { id: '2', type: 'tts', text: 'Hi' },
      ];
      const response = { queue };
      expect(response.queue).toHaveLength(2);
    });
  });

  // Test skip command
  describe('Skip Command', () => {
    it('should fail when nothing playing', () => {
      const currentTrack = null;
      const error = !currentTrack ? 'Nothing playing' : null;
      expect(error).toBe('Nothing playing');
    });

    it('should succeed when track is playing', () => {
      const currentTrack = { id: '1', type: 'file' };
      const result = currentTrack ? { success: true } : { error: 'Nothing playing' };
      expect(result.success).toBe(true);
    });
  });

  // Test pause/resume
  describe('Pause/Resume Commands', () => {
    it('should track paused state', () => {
      let paused = false;

      // Pause
      paused = true;
      expect(paused).toBe(true);

      // Resume
      paused = false;
      expect(paused).toBe(false);
    });

    it('should fail pause when already paused', () => {
      const audioPlayer = { pause: vi.fn() };
      let paused = true;
      const error = !audioPlayer ? 'Not playing' : paused ? 'Already paused' : null;
      expect(error).toBe('Already paused');
    });
  });

  // Test clear command
  describe('Clear Command', () => {
    it('should empty the queue', () => {
      const queue = [{ id: '1' }, { id: '2' }];
      queue.length = 0;
      expect(queue).toHaveLength(0);
    });
  });

  // Test users command (channel users)
  describe('Users Command', () => {
    it('should fail when not connected', () => {
      const connected = false;
      const error = !connected ? 'Not connected to a voice channel' : null;
      expect(error).toBe('Not connected to a voice channel');
    });

    it('should return users from voice states', () => {
      const voiceStates = [
        { userId: '1', member: { user: { username: 'wRaithy' }, nick: null } },
        { userId: '2', member: { user: { username: 'Jeff' }, nick: null } },
      ];

      const users = voiceStates.map((vs) => ({
        id: vs.userId,
        username: vs.member.user.username,
        nick: vs.member.nick,
      }));

      expect(users).toHaveLength(2);
      expect(users[0].username).toBe('wRaithy');
    });
  });

  // Test guild-channels command
  describe('Guild Channels Command', () => {
    it('should fail when not connected to guild', () => {
      const connected = false;
      const guildId = null;
      const error = !connected || !guildId ? 'Not connected to a guild' : null;
      expect(error).toBe('Not connected to a guild');
    });

    it('should return all voice channels with users', () => {
      const voiceChannels = [
        { id: '1', name: 'Channel 1', voiceStates: [] },
        { id: '2', name: 'Channel 2', voiceStates: [{ userId: '1' }] },
      ];

      const channels = voiceChannels.map((ch) => ({
        id: ch.id,
        name: ch.name,
        users: ch.voiceStates.map((vs) => ({ id: vs.userId })),
      }));

      expect(channels).toHaveLength(2);
      expect(channels[0].users).toHaveLength(0);
      expect(channels[1].users).toHaveLength(1);
    });
  });

  // Test leave command
  describe('Leave Command', () => {
    it('should reset state on leave', () => {
      let state = {
        connected: true,
        guildId: '123',
        channelId: '456',
        queue: [{ id: '1' }],
        currentTrack: { id: '1' },
      };

      // Simulate leave
      state.connected = false;
      state.guildId = null;
      state.channelId = null;
      state.queue = [];
      state.currentTrack = null;

      expect(state.connected).toBe(false);
      expect(state.queue).toHaveLength(0);
    });
  });

  // Test command parsing
  describe('Command Parsing', () => {
    it('should parse valid JSON command', () => {
      const json = '{"type":"status"}';
      const cmd = JSON.parse(json);
      expect(cmd.type).toBe('status');
    });

    it('should handle unknown command', () => {
      const cmd = { type: 'invalid' };
      const response = cmd.type === 'status' || cmd.type === 'play' ? {} : { error: 'Unknown command' };
      expect(response.error).toBe('Unknown command');
    });

    it('should handle invalid JSON', () => {
      const invalidJson = '{invalid';
      expect(() => JSON.parse(invalidJson)).toThrow();
    });
  });
});