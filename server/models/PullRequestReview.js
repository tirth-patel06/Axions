const mongoose = require('mongoose');

const pullRequestReviewSchema = new mongoose.Schema(
  {
    owner: { type: String, required: true },
    repo: { type: String, required: true },
    githubRepoId: { type: Number, required: true, index: true },
    pull_number: { type: Number, required: true, index: true },
    commit_id: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    repoId: { type: mongoose.Schema.Types.ObjectId, ref: 'ConnectedRepo', required: true },

    filesAnalyzed: { type: Number, default: 0 },
    commentsPosted: { type: Number, default: 0 },
    confidence: { type: String, default: 'unknown' },
    analysis: { type: mongoose.Schema.Types.Mixed },

    analyzedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

pullRequestReviewSchema.index({ githubRepoId: 1, pull_number: 1 });
pullRequestReviewSchema.index({ githubRepoId: 1, pull_number: 1, commit_id: 1 }, { unique: true });

module.exports = mongoose.model('PullRequestReview', pullRequestReviewSchema);
