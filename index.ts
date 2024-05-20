import { CONFIG_LOADED } from './config';
import { QuestlyAIssistant } from './src/app/app';

if (CONFIG_LOADED) {
  console.log('Configuration loaded successfully');
}

export const AI_SYSTEM = new QuestlyAIssistant();
