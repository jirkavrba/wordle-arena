import { main } from './main.ts';
import cron from 'node-cron';

cron.schedule('10 * * * * *', () => {
  main();
});
