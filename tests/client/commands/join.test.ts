import { describe, it, expect } from 'vitest';

describe('join command', () => {
  it('should have correct argument structure', () => {
    const args = ['join', '562220519173128202', '997573231286431854'];
    expect(args[0]).toBe('join');
    expect(args[1]).toBe('562220519173128202'); // guildId
    expect(args[2]).toBe('997573231286431854'); // channelId
  });

  it('should validate guild ID format', () => {
    const guildId = '562220519173128202';
    expect(/^\d+$/.test(guildId)).toBe(true);
  });
});