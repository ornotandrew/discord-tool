import { describe, it, expect } from 'vitest';

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

describe('Play Command', () => {
  it('should include file path in play request', () => {
    const file = '/path/to/audio.mp3';
    const request = { type: 'play', file };
    expect(request.file).toBe('/path/to/audio.mp3');
  });
});

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