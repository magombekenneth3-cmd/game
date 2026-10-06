import './style.css';
import { GameLoop } from './engine/GameLoop';

document.addEventListener('DOMContentLoaded', async () => {
  const appContainer = document.getElementById('app');
  if (!appContainer) {
    console.error('Failed to locate #app container element.');
    return;
  }

  const gameLoop = new GameLoop(appContainer);
  await gameLoop.start();
});
