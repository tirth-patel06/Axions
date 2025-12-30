const express = require("express");
const { generateIssueLabels, generateIssueSummary } = require("../services/llmService");
const { getLabelColor } = require("../services/githubService");
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

    console.log('\n\n========================================');
    console.log('🧪 TESTING ISSUE LABELING FEATURE');
    console.log('========================================\n');
    
    const testCases = [
      {
        title: "Login form not working on mobile devices",
        description: "When I try to log in from my iPhone, the form doesn't submit. It works fine on desktop. The error appears in the console but I can't see it clearly due to mobile browser limitations."
      },
      {
        title: "Database connection timeout on production",
        description: "The app is experiencing frequent connection timeouts to the MongoDB database. This started happening after we migrated to the new server. Query times have increased significantly."
      },
      {
        title: "Add dark mode support",
        description: "Please add a dark mode theme to improve the user experience for users who prefer dark interfaces. This should follow the system preferences and have a toggle switch."
      },
      {
        title: "Update API documentation",
        description: "The API docs are missing information about the new pagination endpoints added in v2.0. We should update the OpenAPI spec and add examples."
      },
      {
        title: "Potential SQL injection vulnerability in user search",
        description: "The user search endpoint accepts raw user input and concatenates it into the SQL query without parameterization. This could allow SQL injection attacks."
      }
    ];

    const results = [];

    for (const testCase of testCases) {
      console.log(`\n📋 Testing: "${testCase.title}"`);
      console.log(`Description: ${testCase.description.substring(0, 60)}...`);
      
      try {
        // Generate labels
        const labels = await generateIssueLabels(testCase.title, testCase.description);
        
        // Get colors for each label
        const labelsWithColors = labels.map(label => ({
          name: label,
          color: getLabelColor(label)
        }));
        
        // Generate summary
        const summary = await generateIssueSummary(testCase.title, testCase.description);
        
        results.push({
          title: testCase.title,
          labels: labels,
          labelsWithColors: labelsWithColors,
          summary: summary,
          success: true
        });
        
        console.log(`✅ Generated labels: [${labels.join(', ')}]`);
        console.log(`   Colors: ${labelsWithColors.map(l => `${l.name}(#${l.color})`).join(', ')}`);
        console.log(`✅ Generated summary (${summary.length} chars)`);
        console.log(`   Preview: ${summary.substring(0, 80)}...\n`);
      } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        results.push({
          title: testCase.title,
          labels: [],
          labelsWithColors: [],
          summary: '',
          success: false,
          error: error.message
        });
      }
    }

    console.log('\n========================================');
    console.log('🧪 TEST RESULTS WITH LABELS & SUMMARIES');
    console.log('========================================\n');
    
    results.forEach((result, index) => {
      console.log(`${index + 1}. "${result.title}"`);
      if (result.success) {
        console.log(`   ✅ Labels: [${result.labels.join(', ')}]`);
        console.log(`   🎨 Colors:`);
        result.labelsWithColors.forEach(lc => {
          console.log(`      • ${lc.name} → #${lc.color}`);
        });
        console.log(`   📊 Summary: ${result.summary.substring(0, 100)}...`);
      } else {
        console.log(`   ❌ Error: ${result.error}`);
      }
      console.log();
    });

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
