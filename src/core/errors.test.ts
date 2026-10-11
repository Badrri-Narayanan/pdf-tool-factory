import { describe, expect, it } from 'vitest';
import { ToolError, toToolError } from './errors';

describe('toToolError', () => {
  it('returns a ToolError unchanged when it already has a file index', () => {
    const err = new ToolError('CORRUPT_FILE', 'bad', 2);
    expect(toToolError(err, 5)).toBe(err);
  });

  it('adds the file index to a ToolError that has none', () => {
    const result = toToolError(new ToolError('UNSUPPORTED_FORMAT', 'nope'), 3);
    expect(result.code).toBe('UNSUPPORTED_FORMAT');
    expect(result.fileIndex).toBe(3);
  });

  it('maps RangeError to OUT_OF_MEMORY', () => {
    expect(toToolError(new RangeError('Array buffer allocation failed')).code).toBe('OUT_OF_MEMORY');
  });

  it('maps anything else to UNKNOWN and keeps the message', () => {
    const result = toToolError(new Error('boom'), 1);
    expect(result).toMatchObject({ code: 'UNKNOWN', message: 'boom', fileIndex: 1 });
    expect(toToolError('text').message).toBe('text');
  });
});
