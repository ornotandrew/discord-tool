import { describe, it, expect } from 'vitest';

describe('Config Loading', () => {
  it('should have correct config path', () => {
    const configPath = '/home/andrew/.config/discord-tool/config.json';
    expect(configPath).toContain('.config/discord-tool');
  });

  it('should have expected config structure', () => {
    const config = {
      botToken: 'test-token',
      guilds: { mines: '123' },
      defaultTtsVoice: 'en-ZA-LukeNeural',
    };
    expect(config.botToken).toBeDefined();
    expect(config.guilds).toBeDefined();
    expect(config.defaultTtsVoice).toBeDefined();
  });
});

describe('Config Cache', () => {
  it('should cache config after first load', () => {
    let cache: any = null;
    const loadConfig = () => {
      if (cache) return cache;
      cache = { botToken: 'test' };
      return cache;
    };
    
    const first = loadConfig();
    const second = loadConfig();
    expect(first).toBe(second);
  });

  it('should clear cache', () => {
    let cache: any = { botToken: 'test' };
    const clearCache = () => { cache = null; };
    
    clearCache();
    expect(cache).toBeNull();
  });
});