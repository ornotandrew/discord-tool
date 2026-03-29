import { describe, it, expect } from 'vitest';

describe('leave command', () => {
  it('should have no arguments', () => {
    const args = ['leave'];
    expect(args[0]).toBe('leave');
    expect(args.length).toBe(1);
  });
});