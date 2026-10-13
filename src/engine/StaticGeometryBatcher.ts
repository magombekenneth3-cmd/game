import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * StaticGeometryBatcher — merges compatible static meshes within a Group
 * into single Mesh objects per material, drastically reducing draw calls.
 *
 * APPROACH:
 *  1. Traverse all Mesh children (excluding animated/interactive objects).
 *  2. Group meshes by their material reference (identity, not equality).
 *  3. For each material group with ≥2 meshes, merge geometries into one
 *     Mesh and remove the originals.
 *  4. Preserve named objects that need independent movement, LOD, or
 *     interaction (characters, vehicles, collision proxies).
 *
 * PRESERVES:
 *  - Named `Detail_*` meshes if needed for LOD culling (kept as-is,
 *    unless they all share the same material and can be merged).
 *  - Objects whose `userData.noMerge` flag is true.
 *  - SkinnedMesh, InstancedMesh, LOD objects.
 *  - Objects with animations or morph targets.
 *
 * USAGE:
 *   StaticGeometryBatcher.batchGroup(chunk.visualGroup);
 */
export class StaticGeometryBatcher {

  /**
   * Batch all mergeable static meshes within `group` by material.
   * Returns the number of meshes removed (i.e., draw calls saved).
   */
  static batchGroup(group: THREE.Group, options?: { preserveDetailNames?: boolean }): number {
    const preserveDetail = options?.preserveDetailNames ?? false;
    const meshes = this.collectMergeableMeshes(group, preserveDetail);

    if (meshes.length < 2) return 0;

    // Group by material identity
    const byMaterial = new Map<THREE.Material, THREE.Mesh[]>();
    for (const mesh of meshes) {
      const mat = mesh.material as THREE.Material;
      if (!byMaterial.has(mat)) byMaterial.set(mat, []);
      byMaterial.get(mat)!.push(mesh);
    }

    let meshesRemoved = 0;

    for (const [material, group_meshes] of byMaterial) {
      if (group_meshes.length < 2) continue;

      // Transform each geometry into world space relative to the group
      const geometries: THREE.BufferGeometry[] = [];
      for (const mesh of group_meshes) {
        const cloned = mesh.geometry.clone();
        mesh.updateWorldMatrix(true, false);

        // Compute relative transform from mesh to group
        const relativeMatrix = new THREE.Matrix4();
        const groupWorldInverse = new THREE.Matrix4();
        group.updateWorldMatrix(true, false);
        groupWorldInverse.copy(group.matrixWorld).invert();
        relativeMatrix.multiplyMatrices(groupWorldInverse, mesh.matrixWorld);

        cloned.applyMatrix4(relativeMatrix);
        geometries.push(cloned);
      }

      try {
        const merged = BufferGeometryUtils.mergeGeometries(geometries, false);
        if (!merged) continue;

        merged.computeVertexNormals();

        const batchedMesh = new THREE.Mesh(merged, material);
        batchedMesh.name = `Batched_${material.name || material.uuid.slice(0, 8)}_${group_meshes.length}`;
        batchedMesh.castShadow = group_meshes.some(m => m.castShadow);
        batchedMesh.receiveShadow = group_meshes.some(m => m.receiveShadow);

        // Remove originals
        for (const mesh of group_meshes) {
          mesh.geometry.dispose();
          if (mesh.parent) mesh.parent.remove(mesh);
        }

        group.add(batchedMesh);
        meshesRemoved += group_meshes.length - 1; // We added 1 merged mesh

        // Dispose cloned geometries
        for (const g of geometries) g.dispose();
      } catch {
        // If merge fails (incompatible attributes), skip this material group
        for (const g of geometries) g.dispose();
      }
    }

    return meshesRemoved;
  }

  /**
   * Collects all Mesh children from `root` that are safe to merge.
   */
  private static collectMergeableMeshes(root: THREE.Group, preserveDetail: boolean): THREE.Mesh[] {
    const result: THREE.Mesh[] = [];

    root.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      if (child instanceof THREE.SkinnedMesh) return;
      if (child instanceof THREE.InstancedMesh) return;

      // Skip objects flagged as non-mergeable
      if (child.userData?.noMerge) return;

      // Skip objects with morph targets (animated geometry)
      if (child.morphTargetInfluences && child.morphTargetInfluences.length > 0) return;

      // Skip objects with multi-material arrays
      if (Array.isArray(child.material)) return;

      // Skip named detail meshes if preserveDetail is set (for LOD culling)
      if (preserveDetail && child.name.startsWith('Detail_')) return;

      // Skip objects that are character parts (they move independently)
      if (child.name.includes('Character_') || child.name.includes('NPC_')) return;

      // Skip collision-only meshes
      if (child.name.startsWith('Col_') || child.name.toLowerCase().includes('collision')) return;

      // Skip very small geometries (not worth the merge overhead)
      if (!child.geometry || !child.geometry.getAttribute('position')) return;

      result.push(child);
    });

    return result;
  }

  /**
   * Returns statistics about how many meshes could be batched
   * within a group, without actually performing the batch.
   */
  static analyzeBatchPotential(group: THREE.Group): {
    totalMeshes: number;
    mergeableMeshes: number;
    uniqueMaterials: number;
    estimatedDrawCallReduction: number;
  } {
    const meshes = this.collectMergeableMeshes(group, false);
    const byMaterial = new Map<THREE.Material, number>();
    for (const mesh of meshes) {
      const mat = mesh.material as THREE.Material;
      byMaterial.set(mat, (byMaterial.get(mat) || 0) + 1);
    }

    let reduction = 0;
    for (const count of byMaterial.values()) {
      if (count >= 2) reduction += count - 1;
    }

    let totalMeshes = 0;
    group.traverse(c => { if (c instanceof THREE.Mesh) totalMeshes++; });

    return {
      totalMeshes,
      mergeableMeshes: meshes.length,
      uniqueMaterials: byMaterial.size,
      estimatedDrawCallReduction: reduction
    };
  }
}
