import * as THREE from 'three';

export type CharacterAnimationState = 'idle' | 'walk' | 'run' | 'talk' | 'sit' | 'dance';

export interface CharacterAnimationValidation {
  hasIdle: boolean;
  hasWalk: boolean;
  hasRun: boolean;
  hasTalk: boolean;
  hasSit: boolean;
  hasDance: boolean;
  isFullyAnimationReady: boolean;
  missingStates: CharacterAnimationState[];
}

export class CharacterAnimationController {
  public mixer: THREE.AnimationMixer;
  public actions: Map<CharacterAnimationState, THREE.AnimationAction> = new Map();
  public currentState: CharacterAnimationState | null = null;
  private rootObject: THREE.Object3D;

  constructor(rootObject: THREE.Object3D, animations: THREE.AnimationClip[] = []) {
    this.rootObject = rootObject;
    this.mixer = new THREE.AnimationMixer(rootObject);
    this.initActions(animations);
  }

  private initActions(animations: THREE.AnimationClip[]): void {
    if (!animations || animations.length === 0) return;

    animations.forEach((clip) => {
      const nameLower = clip.name.toLowerCase();
      let state: CharacterAnimationState | null = null;

      if (nameLower.includes('idle') || nameLower.includes('stand') || nameLower.includes('breath')) {
        state = 'idle';
      } else if (nameLower.includes('walk') || nameLower.includes('stride') || nameLower.includes('step')) {
        state = 'walk';
      } else if (nameLower.includes('run') || nameLower.includes('sprint') || nameLower.includes('jog')) {
        state = 'run';
      } else if (nameLower.includes('talk') || nameLower.includes('speak') || nameLower.includes('convo') || nameLower.includes('gesture')) {
        state = 'talk';
      } else if (nameLower.includes('sit') || nameLower.includes('seated') || nameLower.includes('chair')) {
        state = 'sit';
      } else if (nameLower.includes('dance') || nameLower.includes('samba') || nameLower.includes('party')) {
        state = 'dance';
      }

      if (state && !this.actions.has(state)) {
        const action = this.mixer.clipAction(clip);
        action.loop = THREE.LoopRepeat;
        this.actions.set(state, action);
      }
    });
  }

  public validateAnimationContract(): CharacterAnimationValidation {
    const required: CharacterAnimationState[] = ['idle', 'walk', 'run'];
    const missing = required.filter(st => !this.actions.has(st));
    return {
      hasIdle: this.actions.has('idle'),
      hasWalk: this.actions.has('walk'),
      hasRun: this.actions.has('run'),
      hasTalk: this.actions.has('talk'),
      hasSit: this.actions.has('sit'),
      hasDance: this.actions.has('dance'),
      isFullyAnimationReady: missing.length === 0,
      missingStates: missing
    };
  }

  public setState(newState: CharacterAnimationState, fadeDuration: number = 0.25): void {
    if (this.currentState === newState) return;

    const targetAction = this.actions.get(newState);
    if (!targetAction) return;

    const currentAction = this.currentState ? this.actions.get(this.currentState) : null;

    if (currentAction === targetAction) {
      this.currentState = newState;
      return;
    }

    targetAction.reset();
    targetAction.enabled = true;
    targetAction.setEffectiveTimeScale(1);
    targetAction.setEffectiveWeight(1);
    targetAction.play();

    if (currentAction && currentAction !== targetAction) {
      currentAction.crossFadeTo(targetAction, fadeDuration, true);
    }

    this.currentState = newState;
  }

  public update(deltaSeconds: number): void {
    if (this.mixer && deltaSeconds > 0) {
      this.mixer.update(deltaSeconds);
    }
  }

  public dispose(): void {
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer.uncacheRoot(this.rootObject);
    }
    this.actions.clear();
    this.currentState = null;
  }
}
