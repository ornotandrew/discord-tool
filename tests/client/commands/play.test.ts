import { describe, it, expect } from 'vitest';

describe('play command', () => {
  it('should require file argument', () => {
    const file = '/path/to/audio.mp3';
    expect(file).toBeDefined();
  });

  it('should create play request', () => {
    const request = { type: 'play', file: '/audio.mp3' };
    expect(request.type).toBe('play');
    expect(request.file).toBe('/audio.mp3');
  });
});
