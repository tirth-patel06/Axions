const mongoose = require('mongoose');

const errorLogSchema = new mongoose.Schema(
  {
    owner: { type: String, required: true },
    repo: { type: String, required: true },
    githubRepoId: { type: Number, required: false },
    pull_number: { type: Number, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    error: { type: String, required: true },
    errorStack: { type: String },
    context: { type: mongoose.Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Optional TTL (90 days). Comment out if persistence is needed longer term.
errorLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

module.exports = mongoose.model('ErrorLog', errorLogSchema);
