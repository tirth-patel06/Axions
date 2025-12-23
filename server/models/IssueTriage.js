const mongoose = require("mongoose");

const issueTriageSchema = new mongoose.Schema(
  {
    owner: { type: String, required: true },
    repo: { type: String, required: true },
    githubRepoId: { type: Number, required: true, index: true },

    issue_number: { type: Number, required: true },

    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    repoId: { type: mongoose.Schema.Types.ObjectId, ref: "ConnectedRepo", required: true, index: true },

    labelsApplied: { type: [String], default: [] },
    summary: { type: String, default: "" },
  },
  { timestamps: true }
);

issueTriageSchema.index({ githubRepoId: 1, issue_number: 1 });

module.exports = mongoose.model("IssueTriage", issueTriageSchema);
