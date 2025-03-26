import { CONFIG_LOADED } from './config';
import { QuestlyAi } from './app/app';

if (CONFIG_LOADED) {
  console.log('Configuration loaded successfully');
}

export const AI_SYSTEM = new QuestlyAi();

// setInterval(() => {
//   const usage = process.memoryUsage();
//   console.log(`[${new Date().toISOString()}] Memory Usage:`);
//   console.log(`RSS: ${(usage.rss / 1024 / 1024).toFixed(2)} MB`);
//   console.log(`Heap Total: ${(usage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
//   console.log(`Heap Used: ${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
//   console.log(`External: ${(usage.external / 1024 / 1024).toFixed(2)} MB`);
//   console.log(`Array Buffers: ${(usage.arrayBuffers / 1024 / 1024).toFixed(2)} MB`);
//   console.log('----------------------');
// }, 60000);
