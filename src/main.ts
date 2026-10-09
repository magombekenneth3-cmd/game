import './style.css';
import { GameLoop } from './engine/GameLoop';

console.info('[KINGMAKER] Build:', typeof __BUILD_REVISION__ !== 'undefined' ? __BUILD_REVISION__ : 'dev');

document.addEventListener('DOMContentLoaded', async () => {
  const appContainer = document.getElementById('app');
  if (!appContainer) {
    console.error('Failed to locate #app container element.');
    return;
  }

  const gameLoop = new GameLoop(appContainer);
  await gameLoop.start();
});
