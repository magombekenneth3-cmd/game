export class SpeedometerUI {
  private container: HTMLDivElement;
  private speedText: HTMLSpanElement;
  private rpmFill: HTMLDivElement;
  private gearText: HTMLSpanElement;
  private hornBtn: HTMLButtonElement;
  private lightBtn: HTMLButtonElement;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'speedometer-widget';
    this.container.style.cssText = `
      position: absolute;
      bottom: 24px;
      right: 24px;
      background: rgba(15, 23, 42, 0.88);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 193, 7, 0.4);
      border-radius: 20px;
      padding: 16px 22px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      min-width: 220px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
      z-index: 1000;
      transition: opacity 0.2s ease, transform 0.2s ease;
    `;

    this.container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: baseline;">
        <span style="font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 0.8px;">SPEEDOMETER</span>
        <span id="speedo-gear" style="font-size: 14px; font-weight: 800; color: #38bdf8; background: rgba(56,189,248,0.2); padding: 2px 8px; border-radius: 6px;">D1</span>
      </div>
      
      <div style="display: flex; align-items: baseline; gap: 8px;">
        <span id="speedo-value" style="font-family: 'Space Grotesk', sans-serif; font-size: 38px; font-weight: 800; color: #f8fafc;">0</span>
        <span style="font-size: 14px; font-weight: 700; color: #ffc107;">KM/H</span>
      </div>

      <!-- RPM Bar -->
      <div style="width: 100%; height: 8px; background: rgba(255, 255, 255, 0.1); border-radius: 4px; overflow: hidden;">
        <div id="speedo-rpm" style="height: 100%; width: 0%; background: linear-gradient(90deg, #10b981, #fbbf24, #ef4444); transition: width 0.08s ease-out;"></div>
      </div>

      <!-- Dashboard Action Controls -->
      <div style="display: flex; gap: 8px; margin-top: 4px;">
        <button id="speedo-horn" style="flex: 1; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); color: #cbd5e1; border-radius: 8px; padding: 6px; font-size: 12px; font-weight: 700; cursor: pointer;">📣 HORN [H]</button>
        <button id="speedo-light" style="flex: 1; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); color: #cbd5e1; border-radius: 8px; padding: 6px; font-size: 12px; font-weight: 700; cursor: pointer;">💡 LIGHTS [L]</button>
      </div>
    `;

    parent.appendChild(this.container);
    this.hide();

    this.speedText = (this.container.querySelector('#speedo-value') || document.createElement('span')) as HTMLSpanElement;
    this.rpmFill = (this.container.querySelector('#speedo-rpm') || document.createElement('div')) as HTMLDivElement;
    this.gearText = (this.container.querySelector('#speedo-gear') || document.createElement('span')) as HTMLSpanElement;
    this.hornBtn = (this.container.querySelector('#speedo-horn') || document.createElement('button')) as HTMLButtonElement;
    this.lightBtn = (this.container.querySelector('#speedo-light') || document.createElement('button')) as HTMLButtonElement;

    if (this.hornBtn && this.hornBtn.addEventListener) {
      this.hornBtn.addEventListener('click', () => {
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyH' }));
        setTimeout(() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyH' })), 300);
      });
    }

    if (this.lightBtn && this.lightBtn.addEventListener) {
      this.lightBtn.addEventListener('click', () => {
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyL' }));
      });
    }
  }

  public show(): void {
    this.container.style.opacity = '1';
    this.container.style.pointerEvents = 'auto';
    this.container.style.transform = 'translateY(0)';
  }

  public hide(): void {
    this.container.style.opacity = '0';
    this.container.style.pointerEvents = 'none';
    this.container.style.transform = 'translateY(15px)';
  }

  public update(speedKph: number, isAccelerating: boolean): void {
    const kph = Math.round(speedKph);
    this.speedText.textContent = `${kph}`;

    // Compute RPM %
    const gearRatio = kph < 30 ? 1 : kph < 60 ? 2 : kph < 90 ? 3 : 4;
    this.gearText.textContent = kph === 0 ? 'P' : `D${gearRatio}`;

    const rpmPercent = Math.min(100, Math.max(10, (kph % 35) / 35 * 80 + (isAccelerating ? 20 : 0)));
    this.rpmFill.style.width = `${rpmPercent}%`;
  }
}
