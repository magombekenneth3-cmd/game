export class SeededRandom {
  private state: number;

  constructor(seed: number = 1337) {
    this.state = seed >>> 0;
  }

  /**
   * Returns a float between 0.0 (inclusive) and 1.0 (exclusive).
   */
  public nextFloat(): number {
    this.state = (this.state + 0x6D2B79F5) >>> 0;
    let z = this.state;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  }

  public nextRange(min: number, max: number): number {
    return min + this.nextFloat() * (max - min);
  }

  public nextInt(min: number, max: number): number {
    return Math.floor(this.nextRange(min, max + 1));
  }

  public choice<T>(array: T[]): T {
    const idx = Math.floor(this.nextFloat() * array.length);
    return array[idx];
  }
}
