import * as THREE from 'three';
import { NPCData, NPCArchetype } from './NPCTypes';
import { SeededRandom } from '../utils/SeededRandom';
import { NPCPersonalityGenerator } from './NPCPersonality';
import { NPCScheduleGenerator } from './NPCSchedule';

export class NPCSpawner {
  private firstNames = ['Otieno', 'Kamau', 'Achieng', 'Mwangi', 'Wanjiku', 'Ochieng', 'Njuguna', 'Kiplangat', 'Muthoni', 'Maina', 'Chebet', 'Oduor', 'Nyambura', 'Kipchirchir', 'Adhiambo', 'Karanja'];
  private lastNames = ['Kiprono', 'Omondi', 'Wambui', 'Kinuthia', 'Anyango', 'Kariuki', 'Njoroge', 'Odhiambo', 'Gicheru', 'Korir', 'Mwangi', 'Kimani', 'Chepkemoi', 'Mutua', 'Onyango'];
  private archetypes: NPCArchetype[] = ['student', 'young_professional', 'office_worker', 'business_owner', 'market_vendor', 'shopkeeper', 'driver', 'security_guard', 'musician', 'artist'];

  public generateDeterministicNPC(id: string, seed: number, homePos: THREE.Vector3, districtId: string = 'district_nairobi'): NPCData {
    const rng = new SeededRandom(seed);

    const firstName = rng.choice(this.firstNames);
    const lastName = rng.choice(this.lastNames);
    const age = rng.nextInt(18, 55);
    const archetype = rng.choice(this.archetypes);

    const personality = NPCPersonalityGenerator.generate(seed + 1, archetype);
    const schedule = NPCScheduleGenerator.generateSchedule(seed + 2, archetype, personality);

    const needs = {
      energy: rng.nextInt(60, 100),
      hunger: rng.nextInt(60, 100),
      social: rng.nextInt(50, 90),
      entertainment: rng.nextInt(40, 90),
      money: rng.nextInt(1000, 25000),
      safety: 85
    };

    const workOffset = new THREE.Vector3(rng.nextRange(-100, 100), 0, rng.nextRange(-100, 100));
    const workLocation = homePos.clone().add(workOffset);

    return {
      id,
      seed,
      firstName,
      lastName,
      age,
      archetype,
      occupation: this.getOccupationName(archetype),
      districtId,
      homeLocation: homePos.clone(),
      workLocation,
      personality,
      needs,
      schedule,
      relationships: new Map()
    };
  }

  private getOccupationName(archetype: NPCArchetype): string {
    switch (archetype) {
      case 'student': return 'University Student';
      case 'young_professional': return 'Software Engineer / Consultant';
      case 'office_worker': return 'Accountant';
      case 'business_owner': return 'Kiosk Owner';
      case 'market_vendor': return 'Market Vendor';
      case 'shopkeeper': return 'Electronics Retailer';
      case 'driver': return 'Matatu Driver';
      case 'security_guard': return 'Security Guard';
      case 'musician': return 'Recording Artist';
      case 'artist': return 'Visual Designer';
      default: return 'Retail Worker';
    }
  }
}
