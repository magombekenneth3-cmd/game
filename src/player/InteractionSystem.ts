import * as THREE from 'three';
import { IInteractable } from './PlayerTypes';

export interface InteractionPromptState {
  hasTarget: boolean;
  target?: IInteractable;
  displayName: string;
  distanceMeters: number;
}

export class InteractionSystem {
  private interactables: Map<string, IInteractable> = new Map();
  private activeTarget?: IInteractable;
  private onPromptChangeCallback?: (state: InteractionPromptState) => void;

  public registerInteractable(interactable: IInteractable): void {
    this.interactables.set(interactable.id, interactable);
  }

  public unregisterInteractable(id: string): void {
    this.interactables.delete(id);
  }

  public update(playerPos: THREE.Vector3, isInteractKeyPressed: boolean): InteractionPromptState {
    let nearestTarget: IInteractable | undefined;
    let minDistance = Infinity;

    this.interactables.forEach((item) => {
      if (item.canInteract()) {
        const dist = playerPos.distanceTo(item.position);
        if (dist <= item.interactionRadius && dist < minDistance) {
          minDistance = dist;
          nearestTarget = item;
        }
      }
    });

    const previousTargetId = this.activeTarget?.id;
    this.activeTarget = nearestTarget;

    const promptState: InteractionPromptState = {
      hasTarget: !!nearestTarget,
      target: nearestTarget,
      displayName: nearestTarget ? nearestTarget.displayName : '',
      distanceMeters: nearestTarget ? parseFloat(minDistance.toFixed(1)) : 0
    };

    if (previousTargetId !== nearestTarget?.id && this.onPromptChangeCallback) {
      this.onPromptChangeCallback(promptState);
    }

    // Trigger interaction when player presses E
    if (isInteractKeyPressed && nearestTarget) {
      console.log(`💬 Interacting with ${nearestTarget.displayName} (${nearestTarget.interactionType})`);
      nearestTarget.interact();
    }

    return promptState;
  }

  public setOnPromptChange(callback: (state: InteractionPromptState) => void): void {
    this.onPromptChangeCallback = callback;
  }

  public getActiveTarget(): IInteractable | undefined {
    return this.activeTarget;
  }
}
