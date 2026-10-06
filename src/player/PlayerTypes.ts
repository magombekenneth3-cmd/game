import * as THREE from 'three';

export type PlayerStateMode =
  | 'IDLE'
  | 'WALKING'
  | 'RUNNING'
  | 'SPRINTING'
  | 'AIRBORNE'
  | 'INTERACTING'
  | 'ENTERING_VEHICLE'
  | 'IN_VEHICLE';

export type InteractionType = 'shop' | 'property' | 'vehicle' | 'npc' | 'door';

export interface IInteractable {
  id: string;
  displayName: string;
  interactionType: InteractionType;
  position: THREE.Vector3;
  interactionRadius: number;
  canInteract(): boolean;
  interact(): void;
}

export interface IInputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
  jump: boolean;
  interact: boolean;
  pause: boolean;
  horn?: boolean;
  lights?: boolean;
  mouseX: number;
  mouseY: number;
}

export interface PlayerConfig {
  walkSpeed: number;        // m/s (default 3.0)
  runSpeed: number;         // m/s (default 6.0)
  sprintSpeed: number;      // m/s (default 10.0)
  acceleration: number;     // m/s² (default 25.0)
  deceleration: number;     // m/s² (default 20.0)
  rotationSpeed: number;    // rad/s (default 12.0)
  gravity: number;          // m/s² (default 20.0)
  jumpForce: number;        // m/s (default 7.5)
}
