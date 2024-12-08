const mongoose = require('mongoose');

const countSchema = new mongoose.Schema({
  pageType: { type: String, required: true },
  visits: { type: Number, default: 0 },
  referrerStats: { type: Map, of: Number },
  dailyVisits: { type: Map, of: Number },
  weeklyVisits: { type: Map, of: Number },
  monthlyVisits: { type: Map, of: Number },
  visitTimestamps: { type: [Date], default: [] },
});

// Remove Mongoose metadata when converting to JSON or Object
countSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    delete ret.$__;
    for (const key in ret) {
      if (key.startsWith('$')) {
        delete ret[key];
      }
    }
    return ret;
  },
});

const Count = mongoose.model('Count', countSchema);

module.exports = Count;
