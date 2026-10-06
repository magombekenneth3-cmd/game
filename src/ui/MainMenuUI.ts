import { AudioManager } from '../audio/AudioManager';

export class MainMenuUI {
  private container: HTMLDivElement;
  private onStartCallback: (mode: 'foot' | 'matatu' | 'club') => void;

  constructor(parent: HTMLElement, onStart: (mode: 'foot' | 'matatu' | 'club') => void) {
    this.onStartCallback = onStart;

    this.container = document.createElement('div');
    this.container.id = 'main-menu-overlay';
    this.container.style.cssText = `
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at center, rgba(15, 23, 42, 0.85) 0%, rgba(9, 13, 22, 0.96) 100%);
      backdrop-filter: blur(20px);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #f8fafc;
      font-family: 'Space Grotesk', sans-serif;
      padding: 24px;
      transition: opacity 0.4s ease;
    `;

    this.container.innerHTML = `
      <div style="max-width: 600px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 20px;">
        
        <!-- Game Logo Header -->
        <div>
          <div style="font-size: 12px; font-weight: 800; color: #ffc107; letter-spacing: 3px; margin-bottom: 6px;">NAIROBI OPEN-WORLD SIMULATION</div>
          <h1 style="font-size: 42px; font-weight: 900; background: linear-gradient(135deg, #ffc107 0%, #f59e0b 50%, #ec4899 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-shadow: 0 10px 30px rgba(255, 193, 7, 0.3);">
            KINGMAKER
          </h1>
          <div style="font-size: 18px; font-weight: 700; color: #cbd5e1; letter-spacing: 2px;">RISE OF AFRICA</div>
        </div>

        <p style="font-size: 14px; color: #94a3b8; line-height: 1.6; max-width: 480px;">
          Experience streaming GIS 3D Nairobi featuring dynamic traffic, native architecture, animated NPCs, customizable Matatus, and interactive night venues.
        </p>

        <!-- Mode Selection Cards -->
        <div style="display: flex; gap: 14px; width: 100%; margin-top: 10px;">
          <div id="mode-foot" style="flex: 1; background: rgba(255,255,255,0.05); border: 2px solid #ffc107; border-radius: 14px; padding: 16px; cursor: pointer; text-align: center; transition: transform 0.2s, background 0.2s;">
            <div style="font-size: 28px; margin-bottom: 6px;">🚶</div>
            <div style="font-weight: 800; font-size: 14px; color: #ffc107;">On-Foot</div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">Ngong Road</div>
          </div>

          <div id="mode-matatu" style="flex: 1; background: rgba(255,255,255,0.05); border: 2px solid rgba(255,255,255,0.15); border-radius: 14px; padding: 16px; cursor: pointer; text-align: center; transition: transform 0.2s, background 0.2s;">
            <div style="font-size: 28px; margin-bottom: 6px;">🚌</div>
            <div style="font-weight: 800; font-size: 14px; color: #ec4899;">Matatu Express</div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">Drive Matatu</div>
          </div>

          <div id="mode-club" style="flex: 1; background: rgba(255,255,255,0.05); border: 2px solid rgba(255,255,255,0.15); border-radius: 14px; padding: 16px; cursor: pointer; text-align: center; transition: transform 0.2s, background 0.2s;">
            <div style="font-size: 28px; margin-bottom: 6px;">🪩</div>
            <div style="font-weight: 800; font-size: 14px; color: #a855f7;">Club Velvet</div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">Kilimani VIP</div>
          </div>
        </div>

        <!-- Launch Button -->
        <button id="btn-start-game" style="width: 100%; padding: 16px; border: none; border-radius: 14px; background: linear-gradient(90deg, #ffc107, #f59e0b); color: #0f172a; font-family: 'Space Grotesk', sans-serif; font-size: 18px; font-weight: 900; letter-spacing: 1px; cursor: pointer; box-shadow: 0 10px 25px rgba(255, 193, 7, 0.4); transition: transform 0.15s ease;">
          ▶ ENTER NAIROBI
        </button>

        <!-- Key Controls Reference -->
        <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 12px 18px; width: 100%; display: flex; justify-content: space-around; font-size: 12px; color: #cbd5e1;">
          <div><strong>WASD</strong> Walk/Drive</div>
          <div><strong>Shift</strong> Sprint</div>
          <div><strong>E</strong> Enter / Talk</div>
          <div><strong>H</strong> Horn</div>
          <div><strong>L</strong> Headlights</div>
        </div>

        <!-- Audio & Graphic Bar -->
        <div style="display: flex; gap: 12px; align-items: center; font-size: 12px; color: #94a3b8;">
          <button id="btn-toggle-audio" style="background: none; border: 1px solid rgba(255,255,255,0.2); color: #cbd5e1; border-radius: 8px; padding: 6px 12px; cursor: pointer;">
            🔊 Audio: ON
          </button>
          <span>WebGPU / WebGL2 Ready</span>
        </div>

      </div>
    `;

    parent.appendChild(this.container);
    this.attachEvents();
  }

  private attachEvents(): void {
    let selectedMode: 'foot' | 'matatu' | 'club' = 'foot';

    const footBtn = this.container.querySelector('#mode-foot') as HTMLElement;
    const matatuBtn = this.container.querySelector('#mode-matatu') as HTMLElement;
    const clubBtn = this.container.querySelector('#mode-club') as HTMLElement;

    const select = (mode: 'foot' | 'matatu' | 'club') => {
      selectedMode = mode;
      footBtn.style.borderColor = mode === 'foot' ? '#ffc107' : 'rgba(255,255,255,0.15)';
      matatuBtn.style.borderColor = mode === 'matatu' ? '#ec4899' : 'rgba(255,255,255,0.15)';
      clubBtn.style.borderColor = mode === 'club' ? '#a855f7' : 'rgba(255,255,255,0.15)';
      AudioManager.getInstance().playClick();
    };

    footBtn.addEventListener('click', () => select('foot'));
    matatuBtn.addEventListener('click', () => select('matatu'));
    clubBtn.addEventListener('click', () => select('club'));

    const startBtn = this.container.querySelector('#btn-start-game') as HTMLButtonElement;
    startBtn.addEventListener('click', () => {
      AudioManager.getInstance().resumeContext();
      AudioManager.getInstance().playCoin();
      this.hide();
      this.onStartCallback(selectedMode);
    });

    const audioBtn = this.container.querySelector('#btn-toggle-audio') as HTMLButtonElement;
    audioBtn.addEventListener('click', () => {
      const muted = AudioManager.getInstance().toggleMute();
      audioBtn.textContent = muted ? '🔇 Audio: OFF' : '🔊 Audio: ON';
    });
  }

  public hide(): void {
    this.container.style.opacity = '0';
    this.container.style.pointerEvents = 'none';
    setTimeout(() => {
      this.container.style.display = 'none';
    }, 400);
  }

  public show(): void {
    this.container.style.display = 'flex';
    this.container.style.opacity = '1';
    this.container.style.pointerEvents = 'auto';
  }
}
