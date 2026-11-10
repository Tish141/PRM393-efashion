import Config from '@/config';
import mongoose from 'mongoose';
import * as dns from 'dns';

export async function initDB() {
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  } catch {}
  try {
    await mongoose.connect(Config.MONGODB_URI, { serverSelectionTimeoutMS: 3000 });
    if (typeof log !== 'undefined') log.info('Connected to MongoDB Atlas');
    else console.log('Connected to MongoDB Atlas');
  } catch (err) {
    if (typeof log !== 'undefined') {
      log.warn('Could not connect to MongoDB Atlas (IP not whitelisted or network timeout). Falling back to local MongoDB at mongodb://127.0.0.1:27017/efash');
    } else {
      console.warn('Could not connect to MongoDB Atlas. Falling back to local MongoDB at mongodb://127.0.0.1:27017/efash');
    }
    await mongoose.connect('mongodb://127.0.0.1:27017/efash');
    if (typeof log !== 'undefined') log.info('Connected to local MongoDB successfully');
    else console.log('Connected to local MongoDB successfully');
  }
}
