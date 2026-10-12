import * as THREE from 'three';

export interface ProduceItem {
  id: string;
  name: string;
  swahiliName: string;
  category: 'FRUIT' | 'VEGETABLE' | 'BEVERAGE';
  unit: string;               // e.g. 'bunch', 'crate', 'piece', 'glass'
  priceKES: number;
  healthRestore: number;
  staminaRestore: number;
  stock: number;
}

export interface MamaMbogaStall {
  id: string;
  name: string;
  vendorName: string;
  position: THREE.Vector3;
  heading: number;
  inventory: ProduceItem[];
  umbrellaColor: number;      // e.g. 0x16a34a (green) or 0xd97706 (amber)
  chalkboardSignText: string;
  reputationDiscountPercent: number;
}

export type MPESATransactionType =
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'SEND_MONEY'
  | 'LIPA_NA_MPESA';

export interface MPESATransaction {
  id: string;
  type: MPESATransactionType;
  amountKES: number;
  feeKES: number;
  agentTillNumber: string;
  timestamp: number;
  status: 'SUCCESS' | 'INSUFFICIENT_FUNDS' | 'EXCEEDS_LIMIT' | 'FAILED';
  smsReceiptMessage: string;
}

export interface MPESAAgentKiosk {
  id: string;
  agentName: string;
  tillNumber: string;
  locationName: string;
  position: THREE.Vector3;
  heading: number;
  minTransactionKES: number;
  maxTransactionKES: number;
  agentFloatKES: number;
  isOpen: boolean;
}

export interface HawkerItem {
  id: string;
  name: string;
  priceKES: number;
  staminaRestore: number;
  stock: number;
}

export interface StreetHawker {
  id: string;
  name: string;
  role: 'WATER_SELLER' | 'NJUGU_SELLER' | 'SUNGLASSES_SELLER';
  position: THREE.Vector3;
  patrolStart: THREE.Vector3;
  patrolEnd: THREE.Vector3;
  patrolProgress: number;     // 0.0 to 1.0
  items: HawkerItem[];
  callouts: string[];
}

export interface BodaBodaTripDestination {
  id: string;
  name: string;
  targetPosition: THREE.Vector3;
  distanceMeters: number;
  fareKES: number;
  travelTimeSeconds: number;
}

export interface BodaBodaStage {
  id: string;
  name: string;
  riderName: string;
  position: THREE.Vector3;
  heading: number;
  availableDestinations: BodaBodaTripDestination[];
  isAvailable: boolean;
}

export interface StreetEconomyTelemetryStats {
  totalProduceBought: number;
  totalProduceSalesKES: number;
  totalMpesaDepositsKES: number;
  totalMpesaWithdrawalsKES: number;
  totalMpesaFeesKES: number;
  totalHawkerPurchases: number;
  totalBodaTripsCompleted: number;
}
