import { describe, expect, it } from 'vitest';
import { applyJobError, moveItem, rotateItem, updateItem, type FileItem } from './fileList';

const item = (id: string): FileItem => ({ id, file: new File([], `${id}.png`), rotation: 0, status: 'ready' });
const ids = (items: FileItem[]) => items.map((i) => i.id);

describe('file list helpers', () => {
  it('moves an item to the position of another', () => {
    const items = [item('a'), item('b'), item('c')];
    expect(ids(moveItem(items, 'c', 'a'))).toEqual(['c', 'a', 'b']);
    expect(ids(moveItem(items, 'a', 'c'))).toEqual(['b', 'c', 'a']);
  });

  it('ignores moves involving unknown ids', () => {
    const items = [item('a'), item('b')];
    expect(moveItem(items, 'a', 'zzz')).toBe(items);
  });

  it('rotates clockwise in 90° steps and wraps around', () => {
    let items = [item('a')];
    for (let i = 0; i < 4; i++) items = rotateItem(items, 'a');
    expect(items[0].rotation).toBe(0);
    expect(rotateItem([item('a')], 'a')[0].rotation).toBe(90);
  });

  it('patches only the matching item', () => {
    const items = updateItem([item('a'), item('b')], 'b', { status: 'error', error: 'bad' });
    expect(items.map((i) => i.status)).toEqual(['ready', 'error']);
  });

  it('marks the file a failed job points at', () => {
    const items = [item('a'), item('b')];
    const marked = applyJobError(items, { status: 'error', code: 'ENCRYPTED_PDF', message: 'x', fileIndex: 1 });
    expect(marked[1]).toMatchObject({ status: 'error', error: 'This PDF is password-protected. Remove the password and try again.' });
    expect(marked[0].status).toBe('ready');
  });

  it('leaves the list alone for job errors without a file, and for other states', () => {
    const items = [item('a')];
    expect(applyJobError(items, { status: 'error', code: 'OUT_OF_MEMORY', message: 'x' })).toBe(items);
    expect(applyJobError(items, { status: 'running', progress: 0.5 })).toBe(items);
  });
});
