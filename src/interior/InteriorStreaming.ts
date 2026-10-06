import { WorldChunkManager } from '../world/WorldChunkManager';
import { InteriorInstance } from './InteriorInstance';
import { InteriorGenerator } from './InteriorGenerator';
import { InteriorSemanticRegistry } from './InteriorSemanticLocation';

export class InteriorStreamingSystem {
  public interiors: Map<string, InteriorInstance> = new Map();
  private semanticRegistry: InteriorSemanticRegistry;
  private processedBuildingIds: Set<string> = new Set();
  private worldSeed: number;

  constructor(semanticRegistry: InteriorSemanticRegistry, worldSeed: number = 1337) {
    this.semanticRegistry = semanticRegistry;
    this.worldSeed = worldSeed;
  }

  public updateStreaming(chunkManager: WorldChunkManager): number {
    let newInteriorsCount = 0;

    chunkManager.chunks.forEach((chunk) => {
      if (chunk.isChunkLoaded()) {
        chunk.buildings.forEach((building) => {
          if (!this.processedBuildingIds.has(building.id)) {
            this.processedBuildingIds.add(building.id);

            const { interactionTier } = InteriorGenerator.classifyBuilding(building, this.worldSeed);

            // Register interiors for Enterable/Functional buildings
            if (interactionTier !== 'EXTERIOR_ONLY') {
              const interior = InteriorGenerator.generateInterior(building, this.worldSeed);
              this.interiors.set(interior.interiorId, interior);

              // Register semantic locations into global semantic registry
              interior.semanticLocations.forEach((loc) => {
                this.semanticRegistry.register(loc);
              });

              newInteriorsCount++;
            }
          }
        });
      }
    });

    return newInteriorsCount;
  }

  public getInteriorForBuilding(buildingId: string): InteriorInstance | undefined {
    return this.interiors.get(`interior_${buildingId}`);
  }

  public getInteriorById(interiorId: string): InteriorInstance | undefined {
    return this.interiors.get(interiorId);
  }
}
