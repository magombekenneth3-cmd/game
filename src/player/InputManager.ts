import { IInputState } from './PlayerTypes';

export class InputManager {
  private inputState: IInputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
    jump: false,
    interact: false,
    pause: false,
    mouseX: 0,
    mouseY: 0
  };

  private isPointerLocked: boolean = false;
  private domElement: HTMLElement;

  constructor(domElement: HTMLElement) {
    this.domElement = domElement;
    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));

    this.domElement.addEventListener('click', () => {
      if (!this.isPointerLocked) {
        this.domElement.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.domElement;
    });

    document.addEventListener('mousemove', (evt) => {
      if (this.isPointerLocked) {
        this.inputState.mouseX = evt.movementX;
        this.inputState.mouseY = evt.movementY;
      }
    });
  }

  private onKeyDown(evt: KeyboardEvent): void {
    switch (evt.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.inputState.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.inputState.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.inputState.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.inputState.right = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.inputState.sprint = true;
        break;
      case 'Space':
        this.inputState.jump = true;
        break;
      case 'KeyE':
        this.inputState.interact = true;
        break;
      case 'KeyH':
        this.inputState.horn = true;
        break;
      case 'KeyL':
        this.inputState.lights = !this.inputState.lights;
        break;
      case 'Escape':
        this.inputState.pause = true;
        if (this.isPointerLocked) {
          document.exitPointerLock();
        }
        break;
    }
  }

  private onKeyUp(evt: KeyboardEvent): void {
    switch (evt.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.inputState.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.inputState.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.inputState.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.inputState.right = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.inputState.sprint = false;
        break;
      case 'Space':
        this.inputState.jump = false;
        break;
      case 'KeyE':
        this.inputState.interact = false;
        break;
      case 'KeyH':
        this.inputState.horn = false;
        break;
      case 'Escape':
        this.inputState.pause = false;
        break;
    }
  }

  public getInput(): IInputState {
    const currentState = { ...this.inputState };
    // Reset mouse deltas after consuming frame input
    this.inputState.mouseX = 0;
    this.inputState.mouseY = 0;
    return currentState;
  }

  public isLocked(): boolean {
    return this.isPointerLocked;
  }
}
