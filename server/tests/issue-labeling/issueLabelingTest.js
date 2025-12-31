const { generateIssueLabels, generateIssueSummary } = require("../../services/llmService");
const { getLabelColor } = require("../../services/githubService");

/**
 * Issue Labeling Test Handler
 * Tests the automatic label generation and summarization feature
 */

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

/**
 * Run all issue labeling tests
 * @returns {Promise<Array>} Array of test results
 */
async function runIssueLabelingTests() {
  console.log('\n\n========================================');
  console.log('🧪 TESTING ISSUE LABELING FEATURE');
  console.log('========================================\n');

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

  return results;
}

module.exports = {
  runIssueLabelingTests,
  testCases
};
