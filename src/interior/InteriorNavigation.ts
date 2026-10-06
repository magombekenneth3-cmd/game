import * as THREE from 'three';
import { InteriorRoom, InteriorDoor } from './InteriorTypes';
import { EnvironmentActivityTag } from '../environment/EnvironmentTypes';

export interface InteriorNavNode {
  roomId: string;
  roomType: string;
  center: THREE.Vector3;
  connectedRoomIds: string[];
}

export class InteriorNavigationGraph {
  public nodes: Map<string, InteriorNavNode> = new Map();
  public doors: Map<string, InteriorDoor> = new Map();

  public buildFromRoomsAndDoors(rooms: InteriorRoom[], doors: InteriorDoor[]): void {
    this.nodes.clear();
    this.doors.clear();

    doors.forEach((door) => this.doors.set(door.id, door));

    rooms.forEach((room) => {
      const center = new THREE.Vector3();
      room.bounds.getCenter(center);

      this.nodes.set(room.id, {
        roomId: room.id,
        roomType: room.type,
        center,
        connectedRoomIds: []
      });
    });

    // Connect rooms sharing doors
    rooms.forEach((roomA) => {
      rooms.forEach((roomB) => {
        if (roomA.id !== roomB.id) {
          const sharesDoor = roomA.entrances.some((doorId) => roomB.entrances.includes(doorId));
          if (sharesDoor) {
            const nodeA = this.nodes.get(roomA.id);
            if (nodeA && !nodeA.connectedRoomIds.includes(roomB.id)) {
              nodeA.connectedRoomIds.push(roomB.id);
            }
          }
        }
      });
    });
  }

  public findIndoorPath(startRoomId: string, targetRoomId: string): THREE.Vector3[] {
    if (!this.nodes.has(startRoomId) || !this.nodes.has(targetRoomId)) {
      return [];
    }

    if (startRoomId === targetRoomId) {
      return [this.nodes.get(startRoomId)!.center.clone()];
    }

    // BFS pathfinding
    const queue: string[] = [startRoomId];
    const visited = new Set<string>([startRoomId]);
    const parentMap = new Map<string, string>();

    let found = false;
    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (curr === targetRoomId) {
        found = true;
        break;
      }

      const node = this.nodes.get(curr);
      if (node) {
        for (const neighborId of node.connectedRoomIds) {
          if (!visited.has(neighborId)) {
            visited.add(neighborId);
            parentMap.set(neighborId, curr);
            queue.push(neighborId);
          }
        }
      }
    }

    if (!found) {
      return [this.nodes.get(targetRoomId)!.center.clone()];
    }

    // Reconstruct path
    const pathRoomIds: string[] = [targetRoomId];
    let curr = targetRoomId;
    while (curr !== startRoomId) {
      const parent = parentMap.get(curr);
      if (!parent) break;
      pathRoomIds.unshift(parent);
      curr = parent;
    }

    return pathRoomIds.map((id) => this.nodes.get(id)!.center.clone());
  }

  public findNearestRoomForActivity(rooms: InteriorRoom[], activityTag: EnvironmentActivityTag): InteriorRoom | undefined {
    return rooms.find((r) => r.activityTags.includes(activityTag));
  }
}
