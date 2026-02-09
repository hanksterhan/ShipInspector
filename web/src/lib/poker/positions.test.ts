import { describe, it, expect } from 'vitest';
import { getPositionLabel, getTablePositions } from './positions';

describe('getPositionLabel', () => {
  it('returns null for invalid seat indices', () => {
    expect(getPositionLabel(-1, 0, 6)).toBe(null);
    expect(getPositionLabel(6, 0, 6)).toBe(null);
    expect(getPositionLabel(10, 0, 6)).toBe(null);
  });

  it('handles heads-up (2 players) correctly', () => {
    expect(getPositionLabel(0, 0, 2)).toBe('BTN');
    expect(getPositionLabel(1, 0, 2)).toBe('BB');
  });

  it('handles 3 players correctly', () => {
    expect(getPositionLabel(0, 0, 3)).toBe('BTN');
    expect(getPositionLabel(1, 0, 3)).toBe('SB');
    expect(getPositionLabel(2, 0, 3)).toBe('BB');
  });

  it('handles 4 players correctly', () => {
    expect(getPositionLabel(0, 0, 4)).toBe('BTN');
    expect(getPositionLabel(1, 0, 4)).toBe('SB');
    expect(getPositionLabel(2, 0, 4)).toBe('BB');
    expect(getPositionLabel(3, 0, 4)).toBe('UTG');
  });

  it('handles 5 players correctly', () => {
    expect(getPositionLabel(0, 0, 5)).toBe('BTN');
    expect(getPositionLabel(1, 0, 5)).toBe('SB');
    expect(getPositionLabel(2, 0, 5)).toBe('BB');
    expect(getPositionLabel(3, 0, 5)).toBe('UTG');
    expect(getPositionLabel(4, 0, 5)).toBe('CO');
  });

  it('handles 6 players correctly', () => {
    expect(getPositionLabel(0, 0, 6)).toBe('BTN');
    expect(getPositionLabel(1, 0, 6)).toBe('SB');
    expect(getPositionLabel(2, 0, 6)).toBe('BB');
    expect(getPositionLabel(3, 0, 6)).toBe('UTG');
    expect(getPositionLabel(4, 0, 6)).toBe('MP');
    expect(getPositionLabel(5, 0, 6)).toBe('CO');
  });

  it('handles 7 players correctly', () => {
    expect(getPositionLabel(0, 0, 7)).toBe('BTN');
    expect(getPositionLabel(1, 0, 7)).toBe('SB');
    expect(getPositionLabel(2, 0, 7)).toBe('BB');
    expect(getPositionLabel(3, 0, 7)).toBe('UTG');
    expect(getPositionLabel(4, 0, 7)).toBe('MP');
    expect(getPositionLabel(5, 0, 7)).toBe('HJ');
    expect(getPositionLabel(6, 0, 7)).toBe('CO');
  });

  it('handles 8 players correctly', () => {
    expect(getPositionLabel(0, 0, 8)).toBe('BTN');
    expect(getPositionLabel(1, 0, 8)).toBe('SB');
    expect(getPositionLabel(2, 0, 8)).toBe('BB');
    expect(getPositionLabel(3, 0, 8)).toBe('UTG');
    expect(getPositionLabel(4, 0, 8)).toBe('UTG+1');
    expect(getPositionLabel(5, 0, 8)).toBe('MP');
    expect(getPositionLabel(6, 0, 8)).toBe('HJ');
    expect(getPositionLabel(7, 0, 8)).toBe('CO');
  });

  it('handles 9 players correctly', () => {
    expect(getPositionLabel(0, 0, 9)).toBe('BTN');
    expect(getPositionLabel(1, 0, 9)).toBe('SB');
    expect(getPositionLabel(2, 0, 9)).toBe('BB');
    expect(getPositionLabel(3, 0, 9)).toBe('UTG');
    expect(getPositionLabel(4, 0, 9)).toBe('UTG+1');
    expect(getPositionLabel(5, 0, 9)).toBe('MP');
    expect(getPositionLabel(6, 0, 9)).toBe('MP+1');
    expect(getPositionLabel(7, 0, 9)).toBe('HJ');
    expect(getPositionLabel(8, 0, 9)).toBe('CO');
  });

  it('handles non-zero button seat correctly', () => {
    expect(getPositionLabel(2, 2, 6)).toBe('BTN');
    expect(getPositionLabel(3, 2, 6)).toBe('SB');
    expect(getPositionLabel(4, 2, 6)).toBe('BB');
    expect(getPositionLabel(5, 2, 6)).toBe('UTG');
    expect(getPositionLabel(0, 2, 6)).toBe('MP');
    expect(getPositionLabel(1, 2, 6)).toBe('CO');
  });

  it('handles button seat at end of table', () => {
    expect(getPositionLabel(5, 5, 6)).toBe('BTN');
    expect(getPositionLabel(0, 5, 6)).toBe('SB');
    expect(getPositionLabel(1, 5, 6)).toBe('BB');
    expect(getPositionLabel(2, 5, 6)).toBe('UTG');
    expect(getPositionLabel(3, 5, 6)).toBe('MP');
    expect(getPositionLabel(4, 5, 6)).toBe('CO');
  });
});

describe('getTablePositions', () => {
  it('returns all positions for a 6-handed table', () => {
    const positions = getTablePositions(0, 6);
    expect(positions.size).toBe(6);
    expect(positions.get(0)).toBe('BTN');
    expect(positions.get(1)).toBe('SB');
    expect(positions.get(2)).toBe('BB');
    expect(positions.get(3)).toBe('UTG');
    expect(positions.get(4)).toBe('MP');
    expect(positions.get(5)).toBe('CO');
  });

  it('returns all positions for a 9-handed table', () => {
    const positions = getTablePositions(0, 9);
    expect(positions.size).toBe(9);
    expect(positions.get(0)).toBe('BTN');
    expect(positions.get(8)).toBe('CO');
  });

  it('returns all positions for heads-up', () => {
    const positions = getTablePositions(0, 2);
    expect(positions.size).toBe(2);
    expect(positions.get(0)).toBe('BTN');
    expect(positions.get(1)).toBe('BB');
  });
});
