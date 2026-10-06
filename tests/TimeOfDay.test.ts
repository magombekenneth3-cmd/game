import { describe, it, expect } from 'vitest';
import { TimeOfDay } from '../src/utils/TimeOfDay';

describe('TimeOfDay Utility Tests', () => {
  it('initializes with default time (14:00)', () => {
    const tod = new TimeOfDay(14.0, 60.0);
    expect(tod.getTime()).toBe(14.0);
  });

  it('updates time correctly based on delta seconds', () => {
    const tod = new TimeOfDay(12.0, 3600.0); // 1 real sec = 1 hour
    tod.update(1.0); // 1 second passed
    expect(tod.getTime()).toBeCloseTo(13.0);
  });

  it('wraps around 24 hours correctly', () => {
    const tod = new TimeOfDay(23.5, 3600.0);
    tod.update(1.0); // +1 hour -> 24.5 -> 0.5
    expect(tod.getTime()).toBeCloseTo(0.5);
  });

  it('correctly toggles streetlights based on night time (18:15 to 05:45)', () => {
    const tod = new TimeOfDay(12.0); // Noon
    expect(tod.getConfig().streetlightsOn).toBe(false);

    tod.setTime(20.0); // 8:00 PM Night
    expect(tod.getConfig().streetlightsOn).toBe(true);

    tod.setTime(3.0); // 3:00 AM Night
    expect(tod.getConfig().streetlightsOn).toBe(true);

    tod.setTime(8.0); // 8:00 AM Morning
    expect(tod.getConfig().streetlightsOn).toBe(false);
  });

  it('calculates sun position vector above horizon during day', () => {
    const tod = new TimeOfDay(12.0); // Noon
    const config = tod.getConfig();
    expect(config.sunPosition.y).toBeGreaterThan(0);
  });
});
