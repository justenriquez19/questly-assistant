import { AgendaService } from './agenda.service';
import { CONFIG_LOADED } from '../config';

/**
 * @description Entry point for initializing and running Agenda as a background task processor.
 */
async function startWorker(): Promise<void> {
  try {
    if (CONFIG_LOADED) {
      console.log('✅ Configuration loaded successfully');
    }

    console.log('⏳ Starting Questly Worker...');
    await AgendaService.getInstance().initialize();
    console.log('✅ Worker is running and tasks are scheduled.');
  } catch (error) {
    console.error('❌ Failed to start worker:', error);
    process.exit(1);
  }
}

void startWorker();
