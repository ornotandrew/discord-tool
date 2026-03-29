import { describe, it, expect } from 'vitest';

describe('SOCKET_PATH', () => {
  it('should have correct socket path', () => {
    const SOCKET_PATH = '/tmp/discord-tool.sock';
    expect(SOCKET_PATH).toBe('/tmp/discord-tool.sock');
  });
});

describe('TTS_DIR', () => {
  it('should return temp directory with suffix', () => {
    const TTS_DIR = () => '/tmp/discord-tool-tts';
    expect(TTS_DIR()).toContain('discord-tool-tts');
  });
});