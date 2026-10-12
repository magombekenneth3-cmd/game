import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { StreetEconomySystem } from '../src/economy/StreetEconomySystem';
import { PlayerState } from '../src/player/PlayerState';
import { EnvironmentAssetKit } from '../src/assets/EnvironmentAssetKit';

describe('Phase 12.0 — Street Economy & Hawker Micro-Interactions Tests', () => {
  let economySystem: StreetEconomySystem;
  let playerState: PlayerState;

  beforeEach(() => {
    StreetEconomySystem.resetInstance();
    economySystem = StreetEconomySystem.getInstance();
    playerState = new PlayerState(2000, 10);
  });

  // --- 1. MAMA MBOGA FRESH PRODUCE STALLS ---
  describe('Mama Mboga Produce Stalls', () => {
    it('initializes authentic Nairobi produce stalls with full vegetable and fruit catalogs', () => {
      const stalls = Array.from(economySystem.mamaMbogaStalls.values());
      expect(stalls.length).toBeGreaterThanOrEqual(2);

      const showcaseStall = economySystem.mamaMbogaStalls.get('stall_showcase_kimathi');
      expect(showcaseStall).toBeDefined();
      expect(showcaseStall?.vendorName).toBe('Mary Wanjiku');
      expect(showcaseStall?.inventory.length).toBe(6);

      const bananaItem = showcaseStall?.inventory.find((i) => i.id === 'item_bananas');
      expect(bananaItem).toBeDefined();
      expect(bananaItem?.priceKES).toBe(50);
      expect(bananaItem?.healthRestore).toBe(10);
      expect(bananaItem?.staminaRestore).toBe(25);

      const sukumaItem = showcaseStall?.inventory.find((i) => i.id === 'item_sukuma');
      expect(sukumaItem).toBeDefined();
      expect(sukumaItem?.priceKES).toBe(30);
      expect(sukumaItem?.healthRestore).toBe(20);
    });

    it('purchases produce using cash and restores player health and stamina', () => {
      playerState.consumeFood(-40, -50); // Lower health and stamina for testing
      const initialCash = playerState.getCash();
      const initialHealth = playerState.getHealth();
      const initialStamina = playerState.getStamina();

      const result = economySystem.purchaseProduce('stall_showcase_kimathi', 'item_bananas', playerState);
      expect(result.success).toBe(true);
      expect(playerState.getCash()).toBe(initialCash - 50);
      expect(playerState.getHealth()).toBe(initialHealth + 10);
      expect(playerState.getStamina()).toBe(initialStamina + 25);
    });

    it('applies reputation loyalty discount when player reputation is >= 25', () => {
      playerState.addReputation(20); // 10 + 20 = 30
      expect(playerState.getReputation()).toBe(30);

      const initialCash = playerState.getCash();
      // Regular banana price is KES 50. 10% discount -> KES 45
      const result = economySystem.purchaseProduce('stall_showcase_kimathi', 'item_bananas', playerState);
      expect(result.success).toBe(true);
      expect(playerState.getCash()).toBe(initialCash - 45);
    });

    it('falls back to M-PESA payment when player has insufficient pocket cash', () => {
      playerState.deductCash(playerState.getCash()); // Empty cash
      expect(playerState.getCash()).toBe(0);
      playerState.addMpesa(1000);

      const initialMpesa = playerState.getMpesaBalance();
      const result = economySystem.purchaseProduce('stall_showcase_kimathi', 'item_sukuma', playerState);
      expect(result.success).toBe(true);
      expect(playerState.getMpesaBalance()).toBe(initialMpesa - 30);
    });

    it('fails gracefully when both cash and M-PESA balances are insufficient', () => {
      playerState.deductCash(playerState.getCash());
      playerState.deductMpesa(playerState.getMpesaBalance());
      expect(playerState.getCash()).toBe(0);
      expect(playerState.getMpesaBalance()).toBe(0);

      const result = economySystem.purchaseProduce('stall_showcase_kimathi', 'item_passion_juice', playerState);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Insufficient funds');
    });
  });

  // --- 2. SAFARICOM M-PESA TARIFFS & KIOSKS ---
  describe('Safaricom M-PESA Agent Kiosks & Tiered Tariffs', () => {
    it('initializes authentic M-PESA agent kiosks with till numbers and float balances', () => {
      const kiosk = economySystem.mpesaKiosks.get('mpesa_showcase_arcade');
      expect(kiosk).toBeDefined();
      expect(kiosk?.agentName).toBe('Safaricom Authorized M-PESA Center');
      expect(kiosk?.tillNumber).toBe('345890');
      expect(kiosk?.isOpen).toBe(true);
      expect(kiosk?.agentFloatKES).toBeGreaterThanOrEqual(250000);
    });

    it('calculates authentic Safaricom tiered withdrawal tariffs strictly to regulation schedule', () => {
      expect(economySystem.calculateWithdrawalFee(100)).toBe(11);
      expect(economySystem.calculateWithdrawalFee(300)).toBe(29);
      expect(economySystem.calculateWithdrawalFee(1000)).toBe(29);
      expect(economySystem.calculateWithdrawalFee(1500)).toBe(30);
      expect(economySystem.calculateWithdrawalFee(2500)).toBe(34);
      expect(economySystem.calculateWithdrawalFee(3500)).toBe(67);
      expect(economySystem.calculateWithdrawalFee(5000)).toBe(67);
      expect(economySystem.calculateWithdrawalFee(7500)).toBe(85);
      expect(economySystem.calculateWithdrawalFee(10000)).toBe(112);
      expect(economySystem.calculateWithdrawalFee(15000)).toBe(162);
      expect(economySystem.calculateWithdrawalFee(20000)).toBe(180);
      expect(economySystem.calculateWithdrawalFee(35000)).toBe(200);
    });

    it('processes cash deposits with strictly zero fees (0 KES fee)', () => {
      const initialCash = playerState.getCash();
      const initialMpesa = playerState.getMpesaBalance();
      const depositAmount = 500;

      const tx = economySystem.depositCash('mpesa_showcase_arcade', depositAmount, playerState);
      expect(tx.status).toBe('SUCCESS');
      expect(tx.feeKES).toBe(0);
      expect(playerState.getCash()).toBe(initialCash - depositAmount);
      expect(playerState.getMpesaBalance()).toBe(initialMpesa + depositAmount);
      expect(tx.smsReceiptMessage).toContain('Confirmed. KSh500 deposited');
    });

    it('processes cash withdrawals deducting requested amount and tiered fee from M-PESA balance', () => {
      playerState.addMpesa(3000);
      const initialCash = playerState.getCash();
      const initialMpesa = playerState.getMpesaBalance();
      const withdrawAmount = 2000;
      const expectedFee = economySystem.calculateWithdrawalFee(withdrawAmount); // 34 KES

      const tx = economySystem.withdrawCash('mpesa_showcase_arcade', withdrawAmount, playerState);
      expect(tx.status).toBe('SUCCESS');
      expect(tx.feeKES).toBe(expectedFee);
      expect(playerState.getCash()).toBe(initialCash + withdrawAmount);
      expect(playerState.getMpesaBalance()).toBe(initialMpesa - withdrawAmount - expectedFee);
      expect(tx.smsReceiptMessage).toContain('Withdrawn KSh2,000');
    });

    it('rejects withdrawal if M-PESA balance cannot cover both the withdrawal and the tariff fee', () => {
      playerState.withdrawFromMpesa(playerState.getMpesaBalance(), 0);
      playerState.addMpesa(500); // Has 500, but fee is 29 (needs 529 total)

      const tx = economySystem.withdrawCash('mpesa_showcase_arcade', 500, playerState);
      expect(tx.status).toBe('INSUFFICIENT_FUNDS');
      expect(tx.smsReceiptMessage).toContain('Insufficient funds in M-PESA');
    });

    it('rejects transactions outside agent limits', () => {
      const tx = economySystem.depositCash('mpesa_showcase_arcade', 10, playerState); // below min 50
      expect(tx.status).toBe('EXCEEDS_LIMIT');
    });
  });

  // --- 3. STREET HAWKERS & ROADSIDE GOODS ---
  describe('Street Hawkers & Roaming Goods', () => {
    it('initializes water and roasted peanut (njugu) hawkers with callouts', () => {
      const waterHawker = economySystem.hawkers.get('hawker_otieno_water');
      expect(waterHawker).toBeDefined();
      expect(waterHawker?.role).toBe('WATER_SELLER');
      expect(waterHawker?.items.length).toBeGreaterThan(0);
      expect(waterHawker?.callouts.length).toBeGreaterThan(0);

      const njuguHawker = economySystem.hawkers.get('hawker_kipchumba_njugu');
      expect(njuguHawker).toBeDefined();
      expect(njuguHawker?.role).toBe('NJUGU_SELLER');
    });

    it('purchases goods from hawkers and restores player stamina', () => {
      playerState.consumeFood(0, -30);
      const initialStamina = playerState.getStamina();

      const res = economySystem.purchaseFromHawker('hawker_otieno_water', 'h_water', playerState);
      expect(res.success).toBe(true);
      expect(playerState.getStamina()).toBe(initialStamina + 25);
    });

    it('updates hawker patrol positions smoothly over time', () => {
      const hawker = economySystem.hawkers.get('hawker_otieno_water');
      expect(hawker).toBeDefined();
      const initialProgress = hawker!.patrolProgress;

      economySystem.update(2.0); // 2 seconds delta
      expect(hawker!.patrolProgress).not.toBe(initialProgress);
    });
  });

  // --- 4. BODA BODA PASSENGER HAILING ---
  describe('Boda Boda Passenger Stage Hailing', () => {
    it('initializes stage with accurate destinations and fares', () => {
      const stage = economySystem.bodaStages.get('stage_showcase_boda');
      expect(stage).toBeDefined();
      expect(stage?.riderName).toContain('Brian');
      expect(stage?.availableDestinations.length).toBe(3);

      const kencomDest = stage?.availableDestinations.find((d) => d.id === 'dest_kencom');
      expect(kencomDest?.fareKES).toBe(50);
      expect(kencomDest?.distanceMeters).toBe(55);
    });

    it('hails Boda Boda, deducts fare, and records trip completion', () => {
      const initialCash = playerState.getCash();
      const res = economySystem.hailBodaBoda('stage_showcase_boda', 'dest_kencom', playerState);

      expect(res.success).toBe(true);
      expect(playerState.getCash()).toBe(initialCash - 50);
      expect(res.destination?.name).toContain('Kencom');

      const telemetry = economySystem.getTelemetry();
      expect(telemetry.totalBodaTripsCompleted).toBe(1);
    });
  });

  // --- 5. PROCEDURAL 3D ASSETS FOR SUPER-REALISM MASTER PLAN ---
  describe('Phase 12 Realism 3D Procedural Meshes', () => {
    it('creates high-fidelity Mama Mboga stall mesh with crates, umbrella, and chalkboard', () => {
      const stallMesh = EnvironmentAssetKit.createHighFidelityMamaMbogaStallMesh();
      expect(stallMesh).toBeInstanceOf(THREE.Group);
      expect(stallMesh.name).toBe('HighFidelityMamaMbogaStall');

      let foundProduce = false;
      let foundUmbrella = false;
      let foundChalkboard = false;

      stallMesh.traverse((child) => {
        if (child.name.startsWith('Produce_')) foundProduce = true;
        if (child.name === 'MamaMboga_ChalkboardSign') foundChalkboard = true;
        if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).geometry instanceof THREE.ConeGeometry) {
          foundUmbrella = true;
        }
      });

      expect(foundProduce).toBe(true);
      expect(foundUmbrella).toBe(true);
      expect(foundChalkboard).toBe(true);
    });

    it('creates branded commercial storefront arcade with Safaricom, Java House, and Equity Bank', () => {
      const arcade = EnvironmentAssetKit.createBrandedCommercialArcadeMesh();
      expect(arcade).toBeInstanceOf(THREE.Group);
      expect(arcade.name).toBe('BrandedCommercialArcade');
      expect(arcade.children.length).toBeGreaterThanOrEqual(10);
    });

    it('creates KICC Iconic Tower Vista landmark mesh with 28-story cylinder and saucer helipad', () => {
      const kicc = EnvironmentAssetKit.createKICCTowerVistaMesh();
      expect(kicc).toBeInstanceOf(THREE.Group);
      expect(kicc.name).toBe('KICCTower_LandmarkVista');

      let meshCount = 0;
      kicc.traverse((c) => {
        if ((c as THREE.Mesh).isMesh) meshCount++;
      });
      expect(meshCount).toBeGreaterThanOrEqual(18); // Core + 16 fins + podium + saucer + cap + spire
    });

    it('creates street name signpost and protective curb bollard meshes', () => {
      const signpost = EnvironmentAssetKit.createStreetSignPostMesh('KENYATTA AVE', 'KIMATHI ST');
      expect(signpost).toBeInstanceOf(THREE.Group);
      expect(signpost.name).toContain('StreetSign_KENYATTA AVE_KIMATHI ST');

      const bollard = EnvironmentAssetKit.createStreetBollardMesh();
      expect(bollard).toBeInstanceOf(THREE.Group);
      expect(bollard.name).toBe('StreetBollard');
    });
  });
});
