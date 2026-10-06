export type TrafficSignalState = 'RED' | 'YELLOW' | 'GREEN';

export interface TrafficSignalCycle {
  red: number;    // seconds
  yellow: number; // seconds
  green: number;  // seconds
}

export class TrafficSignal {
  public id: string;
  public intersectionId: string;
  public state: TrafficSignalState = 'GREEN';
  public timer: number = 0;
  public cycleTimes: TrafficSignalCycle = { green: 12.0, yellow: 3.0, red: 15.0 };

  constructor(id: string, intersectionId: string, initialPhaseOffset: number = 0) {
    this.id = id;
    this.intersectionId = intersectionId;
    this.timer = initialPhaseOffset;
  }

  public update(dt: number): void {
    this.timer += dt;

    if (this.state === 'GREEN' && this.timer >= this.cycleTimes.green) {
      this.state = 'YELLOW';
      this.timer = 0;
    } else if (this.state === 'YELLOW' && this.timer >= this.cycleTimes.yellow) {
      this.state = 'RED';
      this.timer = 0;
    } else if (this.state === 'RED' && this.timer >= this.cycleTimes.red) {
      this.state = 'GREEN';
      this.timer = 0;
    }
  }

  public isGreen(): boolean {
    return this.state === 'GREEN';
  }

  public isRed(): boolean {
    return this.state === 'RED';
  }
}
