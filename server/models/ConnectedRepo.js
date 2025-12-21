const mongoose = require("mongoose");

const connectedRepoSchema = new mongoose.Schema(
  {
    // ownership
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    githubRepoId: {
      type: Number,
      required: true,
    },

    // repo snapshot
    owner: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    fullName: {
      type: String,
      required: true,
    },

    isPrivate: {
      type: Boolean,
      required: true,
    },

    // connection state
    isConnected: {
      type: Boolean,
      default: true,
    },

    connectedAt: {
      type: Date,
      default: Date.now,
    },

    // automation toggles
    prReviewEnabled: {
      type: Boolean,
      default: true,
    },

    issueTriageEnabled: {
      type: Boolean,
      default: true,
    },

    //added during connect
    webhookId: {
      type: Number,
      default: null,
    },

    webhookSecret: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  }
);

//prevent duplicate connections
connectedRepoSchema.index(
  { userId: 1, githubRepoId: 1 },
  { unique: true }
);

module.exports = mongoose.model("ConnectedRepo", connectedRepoSchema);