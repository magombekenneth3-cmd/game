import { describe, it, expect } from 'vitest';
import { getCharacterVisualProfile, CharacterVisualProfile } from '../src/assets/CharacterVisualLibrary';
import { NPCArchetype } from '../src/npc/NPCTypes';
import { ASSET_MANIFEST } from '../src/assets/AssetManifest';

describe('Phase 12.3 — Character Visual System', () => {
  // --- 1. CharacterVisualLibrary unit tests ---

  it('1. player archetype always resolves to char_player_01 with no tinting', () => {
    const profile = getCharacterVisualProfile('player', 12345);
    expect(profile.assetId).toBe('char_player_01');
    expect(profile.skinToneMultiplier).toBeUndefined();
    expect(profile.outfitTopColor).toBeUndefined();
    expect(profile.outfitBottomColor).toBeUndefined();
  });

  it('2. same archetype + seed produces identical profile (deterministic)', () => {
    const a = getCharacterVisualProfile('office_worker', 42);
    const b = getCharacterVisualProfile('office_worker', 42);
    expect(a.assetId).toBe(b.assetId);
    expect(a.skinToneMultiplier).toEqual(b.skinToneMultiplier);
    expect(a.outfitTopColor).toBe(b.outfitTopColor);
    expect(a.outfitBottomColor).toBe(b.outfitBottomColor);
  });

  it('3. different seeds for the same archetype produce visual variation', () => {
    const profiles: CharacterVisualProfile[] = [];
    for (let seed = 1; seed <= 20; seed++) {
      profiles.push(getCharacterVisualProfile('young_professional', seed * 1000));
    }
    // At least 2 distinct outfit top colors across 20 samples
    const uniqueTops = new Set(profiles.map((p) => p.outfitTopColor));
    expect(uniqueTops.size).toBeGreaterThanOrEqual(2);
    // At least 2 distinct skin tones
    const uniqueSkins = new Set(profiles.map((p) => JSON.stringify(p.skinToneMultiplier)));
    expect(uniqueSkins.size).toBeGreaterThanOrEqual(2);
  });

  it('4. every NPC archetype resolves to a valid authored asset ID', () => {
    const archetypes: NPCArchetype[] = [
      'student', 'young_professional', 'office_worker', 'business_owner',
      'market_vendor', 'shopkeeper', 'driver', 'security_guard',
      'teacher', 'health_worker', 'musician', 'artist', 'unemployed'
    ];
    const validAssetIds = [
      'char_player_01', 'char_pedestrian_business_01', 'char_pedestrian_student_01',
      'char_pedestrian_casual_01', 'char_worker_street_01', 'char_driver_01',
      'char_guard_security_01'
    ];
    for (const arch of archetypes) {
      const profile = getCharacterVisualProfile(arch, 999);
      expect(validAssetIds).toContain(profile.assetId);
    }
  });

  it('5. security_guard always maps to char_guard_security_01', () => {
    for (let seed = 0; seed < 10; seed++) {
      const profile = getCharacterVisualProfile('security_guard', seed * 100);
      expect(profile.assetId).toBe('char_guard_security_01');
    }
  });

  it('6. student always maps to char_pedestrian_student_01', () => {
    for (let seed = 0; seed < 10; seed++) {
      const profile = getCharacterVisualProfile('student', seed * 100);
      expect(profile.assetId).toBe('char_pedestrian_student_01');
    }
  });

  it('7. driver always maps to char_driver_01', () => {
    for (let seed = 0; seed < 10; seed++) {
      const profile = getCharacterVisualProfile('driver', seed * 100);
      expect(profile.assetId).toBe('char_driver_01');
    }
  });

  it('8. overrides.assetId forces the returned assetId', () => {
    const profile = getCharacterVisualProfile('student', 42, { assetId: 'char_player_01' });
    expect(profile.assetId).toBe('char_player_01');
  });

  it('9. overrides.outfitColor forces the outfitTopColor', () => {
    const profile = getCharacterVisualProfile('office_worker', 42, { outfitColor: 0xFF0000 });
    expect(profile.outfitTopColor).toBe(0xFF0000);
  });

  it('10. roles with canTintSkin produce a skinToneMultiplier', () => {
    // office_worker has canTintSkin: true
    const profile = getCharacterVisualProfile('office_worker', 42);
    expect(profile.skinToneMultiplier).toBeDefined();
    expect(profile.skinToneMultiplier!.r).toBeGreaterThan(0);
    expect(profile.skinToneMultiplier!.g).toBeGreaterThan(0);
    expect(profile.skinToneMultiplier!.b).toBeGreaterThan(0);
  });

  it('11. roles without canTintSkin do NOT produce skinToneMultiplier', () => {
    // student does not have canTintSkin
    const profile = getCharacterVisualProfile('student', 42);
    expect(profile.skinToneMultiplier).toBeUndefined();
  });

  // --- 2. AssetManifest fallback chain tests ---

  it('12. no character entry in AssetManifest uses fallback_char_humanoid', () => {
    const characterEntries = Object.values(ASSET_MANIFEST).filter(
      (entry) => entry.category === 'character'
    );
    expect(characterEntries.length).toBeGreaterThanOrEqual(7);
    for (const entry of characterEntries) {
      expect(entry.fallbackAssetId).not.toBe('fallback_char_humanoid');
    }
  });

  it('13. every character fallback points to another authored character asset', () => {
    const characterIds = Object.values(ASSET_MANIFEST)
      .filter((e) => e.category === 'character')
      .map((e) => e.id);
    const characterEntries = Object.values(ASSET_MANIFEST).filter(
      (entry) => entry.category === 'character'
    );
    for (const entry of characterEntries) {
      if (entry.fallbackAssetId) {
        expect(characterIds).toContain(entry.fallbackAssetId);
      }
    }
  });

  it('14. all 7 authored character GLB models are registered in the manifest', () => {
    const expectedCharIds = [
      'char_player_01',
      'char_pedestrian_business_01',
      'char_pedestrian_student_01',
      'char_pedestrian_casual_01',
      'char_worker_street_01',
      'char_driver_01',
      'char_guard_security_01'
    ];
    for (const id of expectedCharIds) {
      expect(ASSET_MANIFEST[id]).toBeDefined();
      expect(ASSET_MANIFEST[id].category).toBe('character');
      expect(ASSET_MANIFEST[id].sourceFile).toContain('.glb');
    }
  });

  // --- 3. Population variety stress test ---

  it('15. 40-person crowd has no more than 40% identical visual fingerprints', () => {
    const crowd: string[] = [];
    const archetypes: NPCArchetype[] = [
      'student', 'young_professional', 'office_worker', 'business_owner',
      'market_vendor', 'shopkeeper', 'driver', 'security_guard',
      'musician', 'artist', 'unemployed', 'teacher', 'health_worker'
    ];
    for (let i = 0; i < 40; i++) {
      const arch = archetypes[i % archetypes.length];
      const profile = getCharacterVisualProfile(arch, i * 73 + 1);
      // Create a visual fingerprint string: assetId + skin + top + bottom
      const fingerprint = `${profile.assetId}|${JSON.stringify(profile.skinToneMultiplier)}|${profile.outfitTopColor}|${profile.outfitBottomColor}`;
      crowd.push(fingerprint);
    }
    const uniqueFingerprints = new Set(crowd);
    // At least 60% unique in a 40-person crowd
    expect(uniqueFingerprints.size).toBeGreaterThanOrEqual(24);
  });
});
