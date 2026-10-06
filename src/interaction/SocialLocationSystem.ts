export interface SocialLocation {
  id: string;
  locationType: string;
  capacity: number;
  socialMultiplier: number;
  activities: string[];
  displayName: string;
}

export class SocialLocationSystem {
  private locations: Map<string, SocialLocation> = new Map();

  public registerLocation(location: SocialLocation): void {
    this.locations.set(location.id, location);
  }

  public getLocation(id: string): SocialLocation | undefined {
    return this.locations.get(id);
  }

  public getSocialMultiplier(locationId?: string): number {
    if (!locationId || !this.locations.has(locationId)) {
      return 1.0;
    }
    return this.locations.get(locationId)!.socialMultiplier;
  }

  public getAll(): SocialLocation[] {
    return Array.from(this.locations.values());
  }
}
