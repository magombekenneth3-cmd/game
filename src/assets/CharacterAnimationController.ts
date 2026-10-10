import * as THREE from 'three';

export type CharacterAnimationState = 'idle' | 'walk' | 'run';

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
      }

      if (state && !this.actions.has(state)) {
        const action = this.mixer.clipAction(clip);
        action.loop = THREE.LoopRepeat;
        this.actions.set(state, action);
      }
    });

    // Fallback mapping if specific state names are not explicitly matched
    if (!this.actions.has('idle') && animations.length > 0) {
      const fallbackClip = animations.find((c) => {
        const n = c.name.toLowerCase();
        return !n.includes('tpose') && !n.includes('t-pose') && !n.includes('t_pose');
      }) || animations[0];
      const action = this.mixer.clipAction(fallbackClip);
      action.loop = THREE.LoopRepeat;
      this.actions.set('idle', action);
    }

    if (!this.actions.has('walk') && this.actions.has('idle')) {
      this.actions.set('walk', this.actions.get('idle')!);
    }

    if (!this.actions.has('run') && this.actions.has('walk')) {
      this.actions.set('run', this.actions.get('walk')!);
    }
  }

  public setState(newState: CharacterAnimationState, fadeDuration: number = 0.25): void {
    if (this.currentState === newState) return;

    const targetAction = this.actions.get(newState) || this.actions.get('idle');
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
