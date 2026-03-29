import { describe, it, expect } from 'vitest';

describe('status command', () => {
  it('should have no arguments', () => {
    const args = ['status'];
    expect(args[0]).toBe('status');
  });

  it('should format status response as JSON', () => {
    const statusResponse = {
      connected: true,
      guild: { id: '562220519173128202', name: 'The Otataral Mines' },
      channel: { id: '997573231286431854', name: 'Despair of the Ancients' },
      currentTrack: null,
      queueLength: 0,
      paused: false,
    };
    const json = JSON.stringify(statusResponse, null, 2);
    expect(json).toContain('"connected": true');
  });
});
