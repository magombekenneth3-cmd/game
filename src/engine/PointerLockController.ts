export class PointerLockController {
  private domElement: HTMLElement;
  private isLocked: boolean = false;
  private onLockChangeCallbacks: Array<(locked: boolean) => void> = [];

  constructor(domElement: HTMLElement) {
    this.domElement = domElement;
    this.attachEvents();
  }

  private attachEvents(): void {
    const handlePointerLockChange = () => {
      this.isLocked = document.pointerLockElement === this.domElement;
      this.onLockChangeCallbacks.forEach(cb => cb(this.isLocked));
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);
  }

  public requestLock(): void {
    if (!this.isLocked) {
      this.domElement.requestPointerLock();
    }
  }

  public unlock(): void {
    if (this.isLocked) {
      document.exitPointerLock();
    }
  }

  public onLockChange(callback: (locked: boolean) => void): void {
    this.onLockChangeCallbacks.push(callback);
  }

  public getLocked(): boolean {
    return this.isLocked;
  }
}
