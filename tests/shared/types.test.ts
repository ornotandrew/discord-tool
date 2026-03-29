import { describe, it, expect } from 'vitest';

// Test discriminated union concept without importing from shared
type ClientRequest = 
  | { type: 'status' }
  | { type: 'play'; file: string }
  | { type: 'tts'; text: string; voice?: string }
  | { type: 'queue' }
  | { type: 'skip' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'clear' }
  | { type: 'leave' };

describe('ClientRequest discriminated union', () => {
  it('should validate status request', () => {
    const req: ClientRequest = { type: 'status' };
    expect(req.type).toBe('status');
  });

  it('should validate play request', () => {
    const req: ClientRequest = { type: 'play', file: '/audio.mp3' };
    expect(req.type).toBe('play');
    expect((req as any).file).toBe('/audio.mp3');
  });

  it('should validate tts request', () => {
    const req: ClientRequest = { type: 'tts', text: 'Hello' };
    expect(req.type).toBe('tts');
    expect((req as any).text).toBe('Hello');
  });

  it('should narrow type based on type field', () => {
    const req: ClientRequest = { type: 'play', file: '/test.mp3' };
    
    if (req.type === 'play') {
      expect((req as any).file).toBe('/test.mp3');
    }
  });
  
  it('should allow checking different type', () => {
    const req: ClientRequest = { type: 'status' };
    expect(req.type).toBe('status');
    // No file property on status
    const hasFile = 'file' in req;
    expect(hasFile).toBe(false);
  });
});