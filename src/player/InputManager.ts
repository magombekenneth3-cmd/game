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
    mouseY: 0,
    zoomDelta: 0
  };

  private isPointerLocked: boolean = false;
  private isMouseDown: boolean = false;
  private domElement: HTMLElement;

  private boundKeyDown: (evt: KeyboardEvent) => void;
  private boundKeyUp: (evt: KeyboardEvent) => void;
  private boundBlur: () => void;
  private boundMouseDown: (evt: MouseEvent) => void;
  private boundMouseUp: () => void;
  private boundMouseMove: (evt: MouseEvent) => void;
  private boundWheel: (evt: WheelEvent) => void;
  private boundPointerLockChange: () => void;

  constructor(domElement: HTMLElement) {
    this.domElement = domElement;

    this.boundKeyDown = this.onKeyDown.bind(this);
    this.boundKeyUp = this.onKeyUp.bind(this);
    this.boundBlur = this.resetInputs.bind(this);
    this.boundMouseDown = this.onMouseDown.bind(this);
    this.boundMouseUp = this.onMouseUp.bind(this);
    this.boundMouseMove = this.onMouseMove.bind(this);
    this.boundWheel = this.onWheel.bind(this);
    this.boundPointerLockChange = this.onPointerLockChange.bind(this);

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
    window.addEventListener('blur', this.boundBlur);

    if (this.domElement && typeof this.domElement.addEventListener === 'function') {
      this.domElement.addEventListener('mousedown', this.boundMouseDown);
      this.domElement.addEventListener('wheel', this.boundWheel, { passive: true });
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('mouseup', this.boundMouseUp);
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('pointerlockchange', this.boundPointerLockChange);
      document.addEventListener('mousemove', this.boundMouseMove);
    }
  }

  private onMouseDown(evt: MouseEvent): void {
    this.isMouseDown = true;
    if (!this.isPointerLocked && evt.button === 0 && this.domElement && typeof this.domElement.requestPointerLock === 'function') {
      try {
        this.domElement.requestPointerLock();
      } catch {
        // Safe graceful fallback if browser blocks pointer lock
      }
    }
  }

  private onMouseUp(): void {
    this.isMouseDown = false;
  }

  private onPointerLockChange(): void {
    if (typeof document !== 'undefined') {
      this.isPointerLocked = document.pointerLockElement === this.domElement;
    }
  }

  private onMouseMove(evt: MouseEvent): void {
    // Track mouse input if either pointer is locked or player is clicking/dragging canvas
    if (this.isPointerLocked || this.isMouseDown) {
      this.inputState.mouseX += evt.movementX;
      this.inputState.mouseY += evt.movementY;
    }
  }

  private onWheel(evt: WheelEvent): void {
    if (this.inputState.zoomDelta !== undefined) {
      this.inputState.zoomDelta += Math.sign(evt.deltaY) * 0.75;
    }
  }

  private onKeyDown(evt: KeyboardEvent): void {
    const code = evt.code;
    const key = evt.key ? evt.key.toLowerCase() : '';

    if (code === 'KeyW' || code === 'ArrowUp' || key === 'w' || key === 'arrowup') {
      this.inputState.forward = true;
    } else if (code === 'KeyS' || code === 'ArrowDown' || key === 's' || key === 'arrowdown') {
      this.inputState.backward = true;
    } else if (code === 'KeyA' || code === 'ArrowLeft' || key === 'a' || key === 'arrowleft') {
      this.inputState.left = true;
    } else if (code === 'KeyD' || code === 'ArrowRight' || key === 'd' || key === 'arrowright') {
      this.inputState.right = true;
    } else if (code === 'ShiftLeft' || code === 'ShiftRight' || key === 'shift') {
      this.inputState.sprint = true;
    } else if (code === 'Space' || key === ' ') {
      this.inputState.jump = true;
    } else if (code === 'KeyE' || key === 'e') {
      this.inputState.interact = true;
    } else if (code === 'KeyF' || key === 'f') {
      this.inputState.shop = true;
    } else if (code === 'KeyT' || key === 't') {
      this.inputState.tout = true;
    } else if (code === 'KeyH' || key === 'h') {
      this.inputState.horn = true;
    } else if (code === 'KeyL' || key === 'l') {
      this.inputState.lights = !this.inputState.lights;
    } else if (code === 'Escape' || key === 'escape') {
      this.inputState.pause = true;
      if (this.isPointerLocked && typeof document !== 'undefined') {
        document.exitPointerLock?.();
      }
    }
  }

  private onKeyUp(evt: KeyboardEvent): void {
    const code = evt.code;
    const key = evt.key ? evt.key.toLowerCase() : '';

    if (code === 'KeyW' || code === 'ArrowUp' || key === 'w' || key === 'arrowup') {
      this.inputState.forward = false;
    } else if (code === 'KeyS' || code === 'ArrowDown' || key === 's' || key === 'arrowdown') {
      this.inputState.backward = false;
    } else if (code === 'KeyA' || code === 'ArrowLeft' || key === 'a' || key === 'arrowleft') {
      this.inputState.left = false;
    } else if (code === 'KeyD' || code === 'ArrowRight' || key === 'd' || key === 'arrowright') {
      this.inputState.right = false;
    } else if (code === 'ShiftLeft' || code === 'ShiftRight' || key === 'shift') {
      this.inputState.sprint = false;
    } else if (code === 'Space' || key === ' ') {
      this.inputState.jump = false;
    } else if (code === 'KeyE' || key === 'e') {
      this.inputState.interact = false;
    } else if (code === 'KeyF' || key === 'f') {
      this.inputState.shop = false;
    } else if (code === 'KeyT' || key === 't') {
      this.inputState.tout = false;
    } else if (code === 'KeyH' || key === 'h') {
      this.inputState.horn = false;
    } else if (code === 'Escape' || key === 'escape') {
      this.inputState.pause = false;
    }
  }

  public resetInputs(): void {
    this.inputState.forward = false;
    this.inputState.backward = false;
    this.inputState.left = false;
    this.inputState.right = false;
    this.inputState.sprint = false;
    this.inputState.jump = false;
    this.inputState.interact = false;
    this.inputState.shop = false;
    this.inputState.tout = false;
    this.inputState.horn = false;
    this.inputState.mouseX = 0;
    this.inputState.mouseY = 0;
    if (this.inputState.zoomDelta !== undefined) {
      this.inputState.zoomDelta = 0;
    }
    this.isMouseDown = false;
  }

  public getInput(): IInputState {
    const currentState = { ...this.inputState };
    // Reset consumed per-frame deltas
    this.inputState.mouseX = 0;
    this.inputState.mouseY = 0;
    if (this.inputState.zoomDelta !== undefined) {
      this.inputState.zoomDelta = 0;
    }
    return currentState;
  }

  public isLocked(): boolean {
    return this.isPointerLocked;
  }

  public dispose(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.boundKeyDown);
      window.removeEventListener('keyup', this.boundKeyUp);
      window.removeEventListener('blur', this.boundBlur);
      window.removeEventListener('mouseup', this.boundMouseUp);
    }
    if (this.domElement && typeof this.domElement.removeEventListener === 'function') {
      this.domElement.removeEventListener('mousedown', this.boundMouseDown);
      this.domElement.removeEventListener('wheel', this.boundWheel);
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('pointerlockchange', this.boundPointerLockChange);
      document.removeEventListener('mousemove', this.boundMouseMove);
    }
  }
}
