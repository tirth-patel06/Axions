const mongoose = require("mongoose");

const repoStatsSchema = new mongoose.Schema(
  {
    repoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ConnectedRepo",
      required: true,
    },
    githubRepoId: {
      type: Number,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // PR-related
    totalPRsReviewed: { type: Number, default: 0 },
    totalInlineComments: { type: Number, default: 0 },
    lastPRReviewedAt: { type: Date, default: null },

    // Issue-related
    totalIssuesTriaged: { type: Number, default: 0 },
    totalLabelsApplied: { type: Number, default: 0 },
    lastIssueTriagedAt: { type: Date, default: null },

    // Error tracking
    totalErrors: { type: Number, default: 0 },
    lastErrorAt: { type: Date, default: null },

    // Activity
    lastActivityAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// One stats doc per connected repo
repoStatsSchema.index({ repoId: 1 }, { unique: true });

module.exports = mongoose.model("RepoStats", repoStatsSchema);
