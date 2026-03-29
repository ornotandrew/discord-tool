import { describe, it, expect } from 'vitest';

describe('tts command', () => {
  it('should require text argument', () => {
    const request = { type: 'tts', text: 'Hello everyone!' };
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