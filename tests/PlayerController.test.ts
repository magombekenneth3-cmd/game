import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { PlayerState } from '../src/player/PlayerState';
import { CharacterMotor } from '../src/player/CharacterMotor';
import { InteractionSystem } from '../src/player/InteractionSystem';
import { IInputState } from '../src/player/PlayerTypes';

describe('Phase 2 Player Controller Unit Tests', () => {
  it('initializes PlayerState with default IDLE mode and starting cash', () => {
    const state = new PlayerState();
    expect(state.getMode()).toBe('IDLE');
    expect(state.getCash()).toBe(2500);
    expect(state.getReputation()).toBe(10);
    expect(state.getStamina()).toBe(100);
  });

  it('updates state mode correctly on movement input', () => {
    const motor = new CharacterMotor();
    const idleInput: IInputState = {
      forward: false, backward: false, left: false, right: false,
      sprint: false, jump: false, interact: false, pause: false,
      mouseX: 0, mouseY: 0
    };

    const modeIdle = motor.update(idleInput, 0, 0.016);
    expect(modeIdle).toBe('IDLE');

    const runInput: IInputState = { ...idleInput, forward: true };
    const modeRun = motor.update(runInput, 0, 0.016);
    expect(modeRun).toBe('RUNNING');

    const sprintInput: IInputState = { ...idleInput, forward: true, sprint: true };
    const modeSprint = motor.update(sprintInput, 0, 0.016);
    expect(modeSprint).toBe('SPRINTING');
  });

  it('depletes stamina during sprinting and regenerates during rest', () => {
    const state = new PlayerState();
    state.setMode('SPRINTING');
    state.updateStamina(1.0, true); // 1 sec sprint = -20 stamina
    expect(state.getStamina()).toBe(80);

    state.setMode('IDLE');
    state.updateStamina(1.0, false); // 1 sec rest = +15 stamina
    expect(state.getStamina()).toBe(95);
  });

  it('detects interactables within range and triggers interaction', () => {
    const system = new InteractionSystem();
    let interacted = false;

    system.registerInteractable({
      id: 'test_shop',
      displayName: 'Test Kiosk',
      interactionType: 'shop',
      position: new THREE.Vector3(0, 0, 0),
      interactionRadius: 5.0,
      canInteract: () => true,
      interact: () => { interacted = true; }
    });

    // Player at (0, 0, 2) is 2m away (within 5m radius)
    const playerPos = new THREE.Vector3(0, 0, 2);
    const prompt = system.update(playerPos, false);

    expect(prompt.hasTarget).toBe(true);
    expect(prompt.displayName).toBe('Test Kiosk');
    expect(prompt.distanceMeters).toBe(2);

    // Trigger interaction with E key
    system.update(playerPos, true);
    expect(interacted).toBe(true);
  });

  it('does not target interactables out of range (>5m)', () => {
    const system = new InteractionSystem();
    system.registerInteractable({
      id: 'far_shop',
      displayName: 'Far Kiosk',
      interactionType: 'shop',
      position: new THREE.Vector3(0, 0, 0),
      interactionRadius: 5.0,
      canInteract: () => true,
      interact: () => {}
    });

    // Player at (0, 0, 10) is 10m away (> 5m radius)
    const playerPos = new THREE.Vector3(0, 0, 10);
    const prompt = system.update(playerPos, false);

    expect(prompt.hasTarget).toBe(false);
  });
});
