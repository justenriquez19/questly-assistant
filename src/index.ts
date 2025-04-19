import { CONFIG_LOADED } from './config';
import { QuestlyAi } from './app/app';

export let AI_SYSTEM: QuestlyAi;

if (CONFIG_LOADED && process.env.PROCESS_TYPE === 'web') {
  console.log('Configuration loaded successfully');

  AI_SYSTEM = new QuestlyAi();

  async function bootstrap(): Promise<void> {
    await AI_SYSTEM.mongoService.connect();

    if (process.env.PROCESS_TYPE === 'web') {
      await AI_SYSTEM.agendaService.initialize();
    }

    await AI_SYSTEM.initializeApp();
  }

  void bootstrap();

  setInterval(() => {
    const usage = process.memoryUsage();
    console.log(`[${new Date().toISOString()}] Memory Usage:`);
    console.log(`RSS: ${(usage.rss / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Heap Total: ${(usage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Heap Used: ${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`External: ${(usage.external / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Array Buffers: ${(usage.arrayBuffers / 1024 / 1024).toFixed(2)} MB`);
    console.log('----------------------');
  }, 60000);
}
