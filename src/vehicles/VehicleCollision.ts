import * as THREE from 'three';
import { VehicleDefinition, VehicleRuntimeState } from './VehicleTypes';

export class VehicleCollisionHelper {
  public static calculateSafeExitPosition(
    def: VehicleDefinition,
    state: VehicleRuntimeState,
    environmentMeshes: THREE.Object3D[] = []
  ): THREE.Vector3 {
    const playerRadius = 0.6;
    const sideOffset = def.width / 2 + 1.2;

    // Check Candidate Exit Offsets (Left Side [Driver Door], Right Side, Rear, Front)
    const rightDir = new THREE.Vector3(Math.cos(state.rotationY), 0, -Math.sin(state.rotationY)).normalize();
    const forwardDir = new THREE.Vector3(-Math.sin(state.rotationY), 0, -Math.cos(state.rotationY)).normalize();

    const candidates = [
      // 1. Left Side (Nairobi Driver Side)
      state.position.clone().add(rightDir.clone().multiplyScalar(-sideOffset)),
      // 2. Right Side
      state.position.clone().add(rightDir.clone().multiplyScalar(sideOffset)),
      // 3. Rear
      state.position.clone().add(forwardDir.clone().multiplyScalar(-def.length / 2 - 1.2)),
      // 4. Front
      state.position.clone().add(forwardDir.clone().multiplyScalar(def.length / 2 + 1.2))
    ];

    for (const pos of candidates) {
      let isBlocked = false;

      for (const mesh of environmentMeshes) {
        if (mesh.name.startsWith('Building_')) {
          const box = new THREE.Box3().setFromObject(mesh);
          box.min.x -= playerRadius;
          box.max.x += playerRadius;
          box.min.z -= playerRadius;
          box.max.z += playerRadius;

          if (box.containsPoint(pos)) {
            isBlocked = true;
            break;
          }
        }
      }

      if (!isBlocked) {
        return pos;
      }
    }

    // Fallback: return default left side position
    return candidates[0];
  }
}
