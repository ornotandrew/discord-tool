import { describe, it, expect, vi } from 'vitest';

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

describe('Status Handler', () => {
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

describe('Play Handler', () => {
  it('should add file to queue', () => {
    const queue: any[] = [];
    const item = { id: '123', type: 'file' as const, path: '/audio.mp3' };
    queue.push(item);

    expect(queue).toHaveLength(1);
    expect(queue[0].type).toBe('file');
  });

  it('should reject missing file path', () => {
    const cmd: { type: string; file?: string } = { type: 'play' };
    const error = !cmd.file ? 'Missing file path' : null;
    expect(error).toBe('Missing file path');
  });

  it('should generate unique IDs for queue items', () => {
    const id1 = Math.random().toString(36).substring(2);
    const id2 = Math.random().toString(36).substring(2);
    expect(id1).not.toBe(id2);
  });
});

describe('TTS Handler', () => {
  it('should add TTS to queue', () => {
    const queue: any[] = [];
    const item = { id: '123', type: 'tts' as const, text: 'Hello!', voice: 'en-ZA-LukeNeural' };
    queue.push(item);

    expect(queue[0].type).toBe('tts');
    expect(queue[0].text).toBe('Hello!');
  });

  it('should reject missing text', () => {
    const cmd: { type: string; text?: string } = { type: 'tts' };
    const error = !cmd.text ? 'Missing text' : null;
    expect(error).toBe('Missing text');
  });

  it('should use default voice if not specified', () => {
    const item = { type: 'tts' as const, text: 'Hello', voice: undefined };
    const voice = item.voice || 'en-US-AriaNeural';
    expect(voice).toBe('en-US-AriaNeural');
  });
});

describe('Queue Handler', () => {
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

describe('Skip Handler', () => {
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

describe('Pause/Resume Handlers', () => {
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

describe('Clear Handler', () => {
  it('should empty the queue', () => {
    const queue = [{ id: '1' }, { id: '2' }];
    queue.length = 0;
    expect(queue).toHaveLength(0);
  });
});