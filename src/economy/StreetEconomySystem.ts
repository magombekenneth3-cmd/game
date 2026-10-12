import * as THREE from 'three';
import {
  ProduceItem,
  MamaMbogaStall,
  MPESATransaction,
  MPESAAgentKiosk,
  StreetHawker,
  BodaBodaStage,
  BodaBodaTripDestination,
  StreetEconomyTelemetryStats
} from './StreetEconomyTypes';
import { PlayerState } from '../player/PlayerState';
import { AudioManager } from '../audio/AudioManager';

export class StreetEconomySystem {
  private static instance?: StreetEconomySystem;

  public mamaMbogaStalls: Map<string, MamaMbogaStall> = new Map();
  public mpesaKiosks: Map<string, MPESAAgentKiosk> = new Map();
  public hawkers: Map<string, StreetHawker> = new Map();
  public bodaStages: Map<string, BodaBodaStage> = new Map();

  // Telemetry accumulation
  private totalProduceBought: number = 0;
  private totalProduceSalesKES: number = 0;
  private totalMpesaDepositsKES: number = 0;
  private totalMpesaWithdrawalsKES: number = 0;
  private totalMpesaFeesKES: number = 0;
  private totalHawkerPurchases: number = 0;
  private totalBodaTripsCompleted: number = 0;

  constructor() {
    this.initDefaultProduceStalls();
    this.initDefaultMPESAKiosks();
    this.initDefaultHawkers();
    this.initDefaultBodaStages();
  }

  public static getInstance(): StreetEconomySystem {
    if (!StreetEconomySystem.instance) {
      StreetEconomySystem.instance = new StreetEconomySystem();
    }
    return StreetEconomySystem.instance;
  }

  public static resetInstance(): void {
    StreetEconomySystem.instance = undefined;
  }

  // --- 1. MAMA MBOGA PRODUCE STALLS ---
  private initDefaultProduceStalls(): void {
    const defaultProduce: () => ProduceItem[] = () => [
      {
        id: 'item_bananas',
        name: 'Sweet Yellow Bananas (Ndizi)',
        swahiliName: 'Ndizi zilizoiva',
        category: 'FRUIT',
        unit: 'bunch (mkungu)',
        priceKES: 50,
        healthRestore: 10,
        staminaRestore: 25,
        stock: 40
      },
      {
        id: 'item_sukuma',
        name: 'Fresh Sukuma Wiki (Collard Greens)',
        swahiliName: 'Sukuma Wiki',
        category: 'VEGETABLE',
        unit: 'fresh bunch',
        priceKES: 30,
        healthRestore: 20,
        staminaRestore: 10,
        stock: 50
      },
      {
        id: 'item_tomatoes',
        name: 'Ripe Red Field Tomatoes (Nyanya)',
        swahiliName: 'Nyanya freshi',
        category: 'VEGETABLE',
        unit: 'crate bowl',
        priceKES: 50,
        healthRestore: 15,
        staminaRestore: 15,
        stock: 35
      },
      {
        id: 'item_avocado',
        name: 'Hass Avocado (Parachichi)',
        swahiliName: 'Parachichi',
        category: 'FRUIT',
        unit: '2 ripe pieces',
        priceKES: 60,
        healthRestore: 30,
        staminaRestore: 20,
        stock: 25
      },
      {
        id: 'item_mango',
        name: 'Ngowe Ripe Mango',
        swahiliName: 'Embe dodo',
        category: 'FRUIT',
        unit: 'piece',
        priceKES: 40,
        healthRestore: 15,
        staminaRestore: 30,
        stock: 30
      },
      {
        id: 'item_passion_juice',
        name: 'Fresh Passion Fruit Juice Bottle',
        swahiliName: 'Juisi ya Pasheni',
        category: 'BEVERAGE',
        unit: '500ml cold bottle',
        priceKES: 80,
        healthRestore: 25,
        staminaRestore: 45,
        stock: 20
      }
    ];

    // Stall 0: Mama Mary's Showcase Stall (X = 11.2, Z = 11.0)
    this.mamaMbogaStalls.set('stall_showcase_kimathi', {
      id: 'stall_showcase_kimathi',
      name: "Mama Mary's Fresh Produce",
      vendorName: 'Mary Wanjiku',
      position: new THREE.Vector3(11.2, 0.2, 11.0),
      heading: -Math.PI * 0.4,
      inventory: defaultProduce(),
      umbrellaColor: 0x16a34a, // Vibrant market green
      chalkboardSignText: 'FRESH PRODUCE — Matunda, Mboga, Fresh Daily',
      reputationDiscountPercent: 10
    });

    // Stall 1: Mama Mary's Stall near Kimathi Street corner (X = 14.5, Z = 68.0)
    this.mamaMbogaStalls.set('stall_kimathi_corner', {
      id: 'stall_kimathi_corner',
      name: "Mama Mary's Fresh Produce",
      vendorName: 'Mary Wanjiku',
      position: new THREE.Vector3(14.5, 0.2, 68.0),
      heading: -Math.PI * 0.5,
      inventory: defaultProduce(),
      umbrellaColor: 0x16a34a, // Vibrant market green
      chalkboardSignText: 'FRESH PRODUCE — Matunda, Mboga, Fresh Daily',
      reputationDiscountPercent: 10
    });

    // Stall 2: Kencom Promenade Stall (X = 14.0, Z = 82.0)
    this.mamaMbogaStalls.set('stall_kencom_promenade', {
      id: 'stall_kencom_promenade',
      name: 'Mama Mboga Achieng Green Grocers',
      vendorName: 'Achieng Ochieng',
      position: new THREE.Vector3(14.0, 0.2, 82.0),
      heading: -Math.PI * 0.5,
      inventory: defaultProduce(),
      umbrellaColor: 0xd97706, // Golden amber striped
      chalkboardSignText: 'Mboga Freshi Kutoka Shambani',
      reputationDiscountPercent: 5
    });
  }

  public purchaseProduce(
    stallId: string,
    itemId: string,
    playerState: PlayerState
  ): { success: boolean; item?: ProduceItem; message: string } {
    const stall = this.mamaMbogaStalls.get(stallId);
    if (!stall) {
      return { success: false, message: 'Produce stall not found.' };
    }

    const item = stall.inventory.find((i) => i.id === itemId);
    if (!item) {
      return { success: false, message: 'Item not found in stock.' };
    }

    if (item.stock <= 0) {
      return { success: false, message: 'Item is out of stock.' };
    }

    // Check reputation discount
    let effectivePrice = item.priceKES;
    if (playerState.getReputation() >= 25) {
      effectivePrice = Math.max(10, Math.round(item.priceKES * (1 - stall.reputationDiscountPercent / 100)));
    }

    // Try paying with cash first, then M-PESA
    let paidWithCash = playerState.deductCash(effectivePrice);
    if (!paidWithCash) {
      const paidWithMpesa = playerState.deductMpesa(effectivePrice);
      if (!paidWithMpesa) {
        return {
          success: false,
          message: `Insufficient funds! Need KSh ${effectivePrice} (Cash or M-PESA).`
        };
      }
    }

    // Fulfill order
    item.stock--;
    playerState.consumeFood(item.healthRestore, item.staminaRestore);
    this.totalProduceBought++;
    this.totalProduceSalesKES += effectivePrice;

    // Audio feedback
    AudioManager.getInstance().playCoin();
    AudioManager.getInstance().playMamaMbogaCallout('Asante sana mteja!');

    return {
      success: true,
      item,
      message: `Purchased ${item.name} for KSh ${effectivePrice}. Health +${item.healthRestore}, Stamina +${item.staminaRestore}!`
    };
  }

  // --- 2. M-PESA AGENT KIOSKS & TARIFFS ---
  private initDefaultMPESAKiosks(): void {
    // Showcase Arcades Safaricom & M-PESA Center (X = 14.5, Z = 16.0)
    this.mpesaKiosks.set('mpesa_showcase_arcade', {
      id: 'mpesa_showcase_arcade',
      agentName: 'Safaricom Authorized M-PESA Center',
      tillNumber: '345890',
      locationName: 'Kimathi Street Arcade, Shop #1',
      position: new THREE.Vector3(14.5, 0.2, 16.0),
      heading: -Math.PI * 0.5,
      minTransactionKES: 50,
      maxTransactionKES: 50000,
      agentFloatKES: 350000,
      isOpen: true
    });

    // Standard Safaricom Authorized Agent on Kimathi St
    this.mpesaKiosks.set('mpesa_kimathi_central', {
      id: 'mpesa_kimathi_central',
      agentName: 'Kamau M-PESA Services Ltd',
      tillNumber: '345890',
      locationName: 'Kimathi Street Arcade, Shop #4',
      position: new THREE.Vector3(16.5, 0.2, 54.0),
      heading: -Math.PI * 0.5,
      minTransactionKES: 50,
      maxTransactionKES: 50000,
      agentFloatKES: 250000,
      isOpen: true
    });

    // Kencom Plaza Authorized Agent
    this.mpesaKiosks.set('mpesa_kencom_plaza', {
      id: 'mpesa_kencom_plaza',
      agentName: 'Safaricom Direct Kencom Agent',
      tillNumber: '120456',
      locationName: 'Kencom Stage Waiting Plaza',
      position: new THREE.Vector3(16.5, 0.2, 77.0),
      heading: -Math.PI * 0.5,
      minTransactionKES: 50,
      maxTransactionKES: 70000,
      agentFloatKES: 450000,
      isOpen: true
    });
  }

  public calculateWithdrawalFee(amount: number): number {
    if (amount <= 100) return 11;
    if (amount <= 500) return 29;
    if (amount <= 1000) return 29;
    if (amount <= 1500) return 30;
    if (amount <= 2500) return 34;
    if (amount <= 3500) return 67;
    if (amount <= 5000) return 67;
    if (amount <= 7500) return 85;
    if (amount <= 10000) return 112;
    if (amount <= 15000) return 162;
    if (amount <= 20000) return 180;
    return 200;
  }

  public depositCash(
    kioskId: string,
    amount: number,
    playerState: PlayerState
  ): MPESATransaction {
    const kiosk = this.mpesaKiosks.get(kioskId);
    const timeNow = Date.now();

    if (!kiosk || !kiosk.isOpen) {
      return {
        id: `tx_${timeNow}`,
        type: 'DEPOSIT',
        amountKES: amount,
        feeKES: 0,
        agentTillNumber: kiosk?.tillNumber || '000000',
        timestamp: timeNow,
        status: 'FAILED',
        smsReceiptMessage: 'Transaction failed: Agent kiosk is currently closed.'
      };
    }

    if (amount < kiosk.minTransactionKES || amount > kiosk.maxTransactionKES) {
      return {
        id: `tx_${timeNow}`,
        type: 'DEPOSIT',
        amountKES: amount,
        feeKES: 0,
        agentTillNumber: kiosk.tillNumber,
        timestamp: timeNow,
        status: 'EXCEEDS_LIMIT',
        smsReceiptMessage: `Deposit amount KSh ${amount} outside agent limits (${kiosk.minTransactionKES} - ${kiosk.maxTransactionKES}).`
      };
    }

    const success = playerState.depositToMpesa(amount);
    if (!success) {
      return {
        id: `tx_${timeNow}`,
        type: 'DEPOSIT',
        amountKES: amount,
        feeKES: 0,
        agentTillNumber: kiosk.tillNumber,
        timestamp: timeNow,
        status: 'INSUFFICIENT_FUNDS',
        smsReceiptMessage: `Insufficient cash in pocket to deposit KSh ${amount}.`
      };
    }

    this.totalMpesaDepositsKES += amount;
    AudioManager.getInstance().playMPESATransactionChime();

    return {
      id: `tx_dep_${timeNow}`,
      type: 'DEPOSIT',
      amountKES: amount,
      feeKES: 0, // Deposits are always FREE in Safaricom tariff
      agentTillNumber: kiosk.tillNumber,
      timestamp: timeNow,
      status: 'SUCCESS',
      smsReceiptMessage: `Confirmed. KSh${amount.toLocaleString()} deposited at ${kiosk.agentName} (Till: ${kiosk.tillNumber}). New M-PESA balance: KSh${playerState.getMpesaBalance().toLocaleString()}.`
    };
  }

  public withdrawCash(
    kioskId: string,
    amount: number,
    playerState: PlayerState
  ): MPESATransaction {
    const kiosk = this.mpesaKiosks.get(kioskId);
    const timeNow = Date.now();

    if (!kiosk || !kiosk.isOpen) {
      return {
        id: `tx_${timeNow}`,
        type: 'WITHDRAWAL',
        amountKES: amount,
        feeKES: 0,
        agentTillNumber: kiosk?.tillNumber || '000000',
        timestamp: timeNow,
        status: 'FAILED',
        smsReceiptMessage: 'Transaction failed: Agent kiosk is currently closed.'
      };
    }

    const fee = this.calculateWithdrawalFee(amount);
    const totalRequired = amount + fee;

    if (playerState.getMpesaBalance() < totalRequired) {
      return {
        id: `tx_${timeNow}`,
        type: 'WITHDRAWAL',
        amountKES: amount,
        feeKES: fee,
        agentTillNumber: kiosk.tillNumber,
        timestamp: timeNow,
        status: 'INSUFFICIENT_FUNDS',
        smsReceiptMessage: `Failed. Insufficient funds in M-PESA. Needed: KSh${totalRequired.toLocaleString()} (including KSh${fee} fee).`
      };
    }

    const success = playerState.withdrawFromMpesa(amount, fee);
    if (!success) {
      return {
        id: `tx_${timeNow}`,
        type: 'WITHDRAWAL',
        amountKES: amount,
        feeKES: fee,
        agentTillNumber: kiosk.tillNumber,
        timestamp: timeNow,
        status: 'FAILED',
        smsReceiptMessage: 'Withdrawal processing error.'
      };
    }

    this.totalMpesaWithdrawalsKES += amount;
    this.totalMpesaFeesKES += fee;

    AudioManager.getInstance().playMPESATransactionChime();
    AudioManager.getInstance().playCoin();

    return {
      id: `tx_wth_${timeNow}`,
      type: 'WITHDRAWAL',
      amountKES: amount,
      feeKES: fee,
      agentTillNumber: kiosk.tillNumber,
      timestamp: timeNow,
      status: 'SUCCESS',
      smsReceiptMessage: `Confirmed. Withdrawn KSh${amount.toLocaleString()} from ${kiosk.agentName} (Till: ${kiosk.tillNumber}). Fee: KSh${fee}. New M-PESA balance: KSh${playerState.getMpesaBalance().toLocaleString()}.`
    };
  }

  // --- 3. ROADSIDE STREET HAWKERS ---
  private initDefaultHawkers(): void {
    this.hawkers.set('hawker_otieno_water', {
      id: 'hawker_otieno_water',
      name: 'Otieno Maji Baridi',
      role: 'WATER_SELLER',
      position: new THREE.Vector3(12.0, 0.2, 62.0),
      patrolStart: new THREE.Vector3(12.0, 0.2, 50.0),
      patrolEnd: new THREE.Vector3(12.0, 0.2, 75.0),
      patrolProgress: 0.3,
      items: [
        { id: 'h_water', name: 'Cold Bottled Mineral Water (500ml)', priceKES: 30, staminaRestore: 25, stock: 40 },
        { id: 'h_soda', name: 'Chilled Stoney Tangawizi / Coke', priceKES: 60, staminaRestore: 35, stock: 25 }
      ],
      callouts: ['Maji baridi bosi!', 'Maji ya chupa freshi!', 'Kunywa maji baridi hapa!']
    });

    this.hawkers.set('hawker_kipchumba_njugu', {
      id: 'hawker_kipchumba_njugu',
      name: 'Kipchumba Njugu Moto',
      role: 'NJUGU_SELLER',
      position: new THREE.Vector3(11.0, 0.2, 70.0),
      patrolStart: new THREE.Vector3(11.0, 0.2, 60.0),
      patrolEnd: new THREE.Vector3(11.0, 0.2, 85.0),
      patrolProgress: 0.5,
      items: [
        { id: 'h_njugu_small', name: 'Cone Roasted Peanuts (Njugu Karanga)', priceKES: 20, staminaRestore: 15, stock: 60 },
        { id: 'h_njugu_salted', name: 'Salted Cashews & Groundnuts', priceKES: 50, staminaRestore: 25, stock: 30 }
      ],
      callouts: ['Njugu moto moto!', 'Kumi kumi karanga!', 'Njugu tamu bosi!']
    });
  }

  public purchaseFromHawker(
    hawkerId: string,
    itemId: string,
    playerState: PlayerState
  ): { success: boolean; message: string } {
    const hawker = this.hawkers.get(hawkerId);
    if (!hawker) return { success: false, message: 'Hawker not found.' };

    const item = hawker.items.find((i) => i.id === itemId);
    if (!item) return { success: false, message: 'Item not available.' };
    if (item.stock <= 0) return { success: false, message: 'Item sold out.' };

    if (!playerState.deductCash(item.priceKES)) {
      if (!playerState.deductMpesa(item.priceKES)) {
        return { success: false, message: `Need KSh ${item.priceKES} to purchase.` };
      }
    }

    item.stock--;
    playerState.consumeFood(5, item.staminaRestore);
    this.totalHawkerPurchases++;

    AudioManager.getInstance().playCoin();
    const callout = hawker.callouts[Math.floor(Math.random() * hawker.callouts.length)];
    AudioManager.getInstance().playHawkerCallout(callout);

    return {
      success: true,
      message: `Bought ${item.name} from ${hawker.name} for KSh ${item.priceKES}. Stamina +${item.staminaRestore}!`
    };
  }

  // --- 4. BODA BODA PASSENGER HAILING ---
  private initDefaultBodaStages(): void {
    const destinations: BodaBodaTripDestination[] = [
      {
        id: 'dest_kencom',
        name: 'Kencom / Ambassador Bus Stage',
        targetPosition: new THREE.Vector3(12.0, 0.2, 72.0),
        distanceMeters: 55,
        fareKES: 50,
        travelTimeSeconds: 4.0
      },
      {
        id: 'dest_gpo',
        name: 'GPO / Teleposta Building',
        targetPosition: new THREE.Vector3(-10.0, 0.2, 26.0),
        distanceMeters: 110,
        fareKES: 70,
        travelTimeSeconds: 7.0
      },
      {
        id: 'dest_railways',
        name: 'Railways Bus Terminus',
        targetPosition: new THREE.Vector3(0.0, 0.2, -45.0),
        distanceMeters: 175,
        fareKES: 100,
        travelTimeSeconds: 10.0
      }
    ];

    // Showcase Boda stage near crossing (X = 7.2, Z = 7.5)
    this.bodaStages.set('stage_showcase_boda', {
      id: 'stage_showcase_boda',
      name: 'Kenyatta Ave / Kimathi Boda Stage',
      riderName: 'Brian "Nduthi" Mwangi',
      position: new THREE.Vector3(7.2, 0.2, 7.5),
      heading: 0,
      availableDestinations: destinations,
      isAvailable: true
    });

    this.bodaStages.set('stage_boda_kimathi', {
      id: 'stage_boda_kimathi',
      name: 'Kimathi Street Boda Boda Stage',
      riderName: 'Brian "Nduthi" Mwangi',
      position: new THREE.Vector3(6.5, 0.2, 52.0),
      heading: 0,
      availableDestinations: destinations,
      isAvailable: true
    });
  }

  public hailBodaBoda(
    stageId: string,
    destinationId: string,
    playerState: PlayerState
  ): { success: boolean; destination?: BodaBodaTripDestination; message: string } {
    const stage = this.bodaStages.get(stageId);
    if (!stage || !stage.isAvailable) {
      return { success: false, message: 'Boda Boda rider is currently unavailable.' };
    }

    const dest = stage.availableDestinations.find((d) => d.id === destinationId);
    if (!dest) {
      return { success: false, message: 'Invalid destination selected.' };
    }

    // Fare deduction (Cash or M-PESA)
    const paidCash = playerState.deductCash(dest.fareKES);
    if (!paidCash) {
      const paidMpesa = playerState.deductMpesa(dest.fareKES);
      if (!paidMpesa) {
        return {
          success: false,
          message: `Insufficient funds for Boda fare (KSh ${dest.fareKES}).`
        };
      }
    }

    this.totalBodaTripsCompleted++;
    AudioManager.getInstance().playBodaBodaRev();

    return {
      success: true,
      destination: dest,
      message: `Hailed Boda with ${stage.riderName} to ${dest.name}! Fare KSh ${dest.fareKES} paid.`
    };
  }

  // --- 5. PER-FRAME UPDATE LOOP ---
  public update(fixedDt: number): void {
    // Update patrol movement for active street hawkers
    this.hawkers.forEach((hawker) => {
      hawker.patrolProgress += fixedDt * 0.05; // Gentle patrol pacing
      if (hawker.patrolProgress > 1.0) hawker.patrolProgress -= 1.0;

      // Ping-pong or linear patrol interpolation
      const t = Math.abs(Math.sin(hawker.patrolProgress * Math.PI));
      hawker.position.lerpVectors(hawker.patrolStart, hawker.patrolEnd, t);
    });
  }

  // --- 6. TELEMETRY & REPORTING ---
  public getTelemetry(): StreetEconomyTelemetryStats {
    return {
      totalProduceBought: this.totalProduceBought,
      totalProduceSalesKES: this.totalProduceSalesKES,
      totalMpesaDepositsKES: this.totalMpesaDepositsKES,
      totalMpesaWithdrawalsKES: this.totalMpesaWithdrawalsKES,
      totalMpesaFeesKES: this.totalMpesaFeesKES,
      totalHawkerPurchases: this.totalHawkerPurchases,
      totalBodaTripsCompleted: this.totalBodaTripsCompleted
    };
  }
}
