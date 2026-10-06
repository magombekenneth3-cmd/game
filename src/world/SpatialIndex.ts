import * as THREE from 'three';

export interface SpatialItem<T = any> {
  id: string;
  position: THREE.Vector3;
  bounds?: THREE.Box3;
  data: T;
  type: 'building' | 'road' | 'interactable' | 'collision_proxy' | 'chunk';
}

export class SpatialIndex {
  private cellSize: number;
  private grid: Map<string, Set<SpatialItem>> = new Map();
  private itemsById: Map<string, SpatialItem> = new Map();

  constructor(cellSize: number = 50.0) {
    this.cellSize = cellSize;
  }

  private getCellKey(x: number, z: number): string {
    const cx = Math.floor(x / this.cellSize);
    const cz = Math.floor(z / this.cellSize);
    return `${cx}:${cz}`;
  }

  public insert(item: SpatialItem): void {
    if (this.itemsById.has(item.id)) {
      this.remove(item.id);
    }

    this.itemsById.set(item.id, item);

    if (item.bounds) {
      // Insert into all cells covered by the bounding box
      const minCx = Math.floor(item.bounds.min.x / this.cellSize);
      const maxCx = Math.floor(item.bounds.max.x / this.cellSize);
      const minCz = Math.floor(item.bounds.min.z / this.cellSize);
      const maxCz = Math.floor(item.bounds.max.z / this.cellSize);

      for (let cx = minCx; cx <= maxCx; cx++) {
        for (let cz = minCz; cz <= maxCz; cz++) {
          const key = `${cx}:${cz}`;
          if (!this.grid.has(key)) this.grid.set(key, new Set());
          this.grid.get(key)!.add(item);
        }
      }
    } else {
      const key = this.getCellKey(item.position.x, item.position.z);
      if (!this.grid.has(key)) this.grid.set(key, new Set());
      this.grid.get(key)!.add(item);
    }
  }

  public remove(id: string): void {
    const item = this.itemsById.get(id);
    if (!item) return;

    this.itemsById.delete(id);
    this.grid.forEach((cellSet) => {
      cellSet.delete(item);
    });
  }

  public queryRadius<T = any>(center: THREE.Vector3, radius: number, typeFilter?: string): SpatialItem<T>[] {
    const results = new Set<SpatialItem<T>>();
    const radiusSq = radius * radius;

    const minCx = Math.floor((center.x - radius) / this.cellSize);
    const maxCx = Math.floor((center.x + radius) / this.cellSize);
    const minCz = Math.floor((center.z - radius) / this.cellSize);
    const maxCz = Math.floor((center.z + radius) / this.cellSize);

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cz = minCz; cz <= maxCz; cz++) {
        const key = `${cx}:${cz}`;
        const cellSet = this.grid.get(key);
        if (cellSet) {
          cellSet.forEach((item) => {
            if (!typeFilter || item.type === typeFilter) {
              const dx = item.position.x - center.x;
              const dz = item.position.z - center.z;
              if (dx * dx + dz * dz <= radiusSq) {
                results.add(item as SpatialItem<T>);
              }
            }
          });
        }
      }
    }

    return Array.from(results);
  }

  public clear(): void {
    this.grid.clear();
    this.itemsById.clear();
  }

  public getItemCount(): number {
    return this.itemsById.size;
  }
}
