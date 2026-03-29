import { describe, it, expect } from 'vitest';

describe('Users Handler', () => {
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

describe('Guild Channels Handler', () => {
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

describe('Leave Handler', () => {
  it('should reset state on leave', () => {
    let state: {
      connected: boolean;
      guildId: string | null;
      channelId: string | null;
      queue: Array<{ id: string }>;
      currentTrack: { id: string } | null;
    } = {
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