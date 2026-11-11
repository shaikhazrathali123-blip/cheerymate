/** Creates all MongoDB indexes, including the 2dsphere index on users.location. Run: npm run indexes */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import mongoose from "mongoose";
import { withSrvDnsFallback } from "../lib/mongo-dns";
import { Block, Match, Message, PushSubscription, RateLimit, Report, Swipe, User } from "../models";

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("Set MONGODB_URI in .env.local first");
  await withSrvDnsFallback(() => mongoose.connect(process.env.MONGODB_URI!));
  for (const model of [User, Swipe, Match, Message, Report, Block, PushSubscription, RateLimit]) {
    await (model as mongoose.Model<unknown>).createIndexes(); // never drops existing indexes
    console.log(`✓ ${model.modelName}`);
  }
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
