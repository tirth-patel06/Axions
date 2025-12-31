const express = require("express");
const { generateIssueLabels, generateIssueSummary } = require("../services/llmService");
const { getLabelColor } = require("../services/githubService");
const { runIssueLabelingTests } = require("../tests/issue-labeling/issueLabelingTest");
const router = express.Router();

/**
 * Test endpoint for issue labeling feature
 * POST /api/issues/test
 */
router.post("/test", async (req, res) => {
  try {
    // Check if at least one feature is enabled
    const isLabelingEnabled = process.env.FEATURE_ISSUE_LABELING === "true" || process.env.ENABLE_AUTO_LABELS === "true";
    const isSummarizationEnabled = process.env.FEATURE_ISSUE_SUMMARIZATION === "true" || process.env.ENABLE_AUTO_SUMMARY === "true";
    
    if (!isLabelingEnabled && !isSummarizationEnabled) {
      return res.status(403).json({
        success: false,
        message: 'All issue features are disabled'
      });
    }

    // Run tests from the dedicated test module
    const results = await runIssueLabelingTests();

    res.json({
      success: true,
      message: 'Issue labeling test completed',
      results: results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Test failed',
      error: error.message
    });
  }
});

/**
 * Generate labels for an issue
 * POST /api/issues/generate-labels
 * Body: { title: string, description: string }
 */
router.post("/generate-labels", async (req, res) => {
  try {
    // Check if feature is enabled
    if (process.env.FEATURE_ISSUE_LABELING !== "true" && process.env.ENABLE_AUTO_LABELS !== "true") {
      return res.status(403).json({
        success: false,
        message: 'Issue labeling feature is disabled'
      });
    }

    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Issue title is required'
      });
    }

    const labels = await generateIssueLabels(title, description || '');
    const labelsWithColors = labels.map(label => ({
      name: label,
      color: getLabelColor(label)
    }));

    res.json({
      success: true,
      data: {
        labels,
        labelsWithColors
      }
    });
  } catch (error) {
    console.error('Generate labels error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate labels',
      error: error.message
    });
  }
});

/**
 * Generate summary for an issue
 * POST /api/issues/generate-summary
 * Body: { title: string, description: string }
 */
router.post("/generate-summary", async (req, res) => {
  try {
    // Check if feature is enabled
    if (process.env.FEATURE_ISSUE_SUMMARIZATION !== "true" && process.env.ENABLE_AUTO_SUMMARY !== "true") {
      return res.status(403).json({
        success: false,
        message: 'Issue summarization feature is disabled'
      });
    }

    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Issue title is required'
      });
    }

    const summary = await generateIssueSummary(title, description || '');

    res.json({
      success: true,
      data: {
        summary
      }
    });
  } catch (error) {
    console.error('Generate summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate summary',
      error: error.message
    });
  }
});

/**
 * Get label color
 * GET /api/issues/label-color/:label
 */
router.get("/label-color/:label", (req, res) => {
  try {
    const { label } = req.params;
    const color = getLabelColor(label);

    res.json({
      success: true,
      data: {
        label,
        color: `#${color}`
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get label color',
      error: error.message
    });
  }
});

/**
 * Get all labels with their colors
 * GET /api/issues/label-colors
 */
router.get("/label-colors", (req, res) => {
  try {
    const { labelColorMap } = require("../services/githubService");
    
    const labels = Object.entries(labelColorMap).map(([name, color]) => ({
      name,
      color: `#${color}`
    }));

    res.json({
      success: true,
      data: {
        labels,
        total: labels.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get label colors',
      error: error.message
    });
  }
});

module.exports = router;
