const fs = require('fs');
const path = require('path');
const parseDiff = require('parse-diff');
const { Octokit } = require("@octokit/rest");
const { getAIReviewForFile, generatePRTextSummary } = require('./llmService');

// -------------------------------------------------
// UTILITY FUNCTIONS
// -------------------------------------------------

/**
 * Detects the category of a comment based on its prefix
 */
function detectCategory(comment) {
  const match = comment.match(/^\s*\[(Security|Bug|Performance|Quality|Best\s*Practice|Error\s*Handling)\]/i);
  if (!match) return 'Uncategorized';
  const raw = match[1].toLowerCase();
  if (raw.startsWith('security')) return 'Security';
  if (raw.startsWith('bug')) return 'Bug';
  if (raw.startsWith('performance')) return 'Performance';
  if (raw.startsWith('quality')) return 'Quality';
  if (raw.startsWith('best')) return 'Best Practice';
  if (raw.startsWith('error')) return 'Error Handling';
  return 'Uncategorized';
}

/**
 * Writes a JSON summary of the review to disk
 */
function writeSummary(owner, repo, pull_number, commit_id, filesReviewed, reviewComments) {
  const summariesDir = path.join(process.cwd(), 'summaries');
  try {
    if (!fs.existsSync(summariesDir)) {
      fs.mkdirSync(summariesDir, { recursive: true });
    }

    const byCategory = {};
    const comments = reviewComments.map((c) => {
      const category = detectCategory(c.body);
      byCategory[category] = (byCategory[category] || 0) + 1;
      return { file: c.path, line: c.position, comment: c.body, category };
    });

    const payload = {
      pr: { owner, repo, number: pull_number, commit_id },
      generatedAt: new Date().toISOString(),
      filesReviewed,
      counts: {
        totalComments: reviewComments.length,
        byCategory
      },
      comments
    };

    const filename = `pr-${pull_number}-${String(commit_id).slice(0, 7)}-${Date.now()}.json`;
    const filepath = path.join(summariesDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(payload, null, 2), 'utf8');
    console.log(`📄 Summary written to: ${filepath}`);
  } catch (err) {
    console.error('Failed to write summary file:', err);
  }
}

/**
 * Writes a human-readable text summary
 */
function writeTextSummary(owner, repo, pull_number, commit_id, text) {
  const summariesDir = path.join(process.cwd(), 'summaries');
  try {
    if (!fs.existsSync(summariesDir)) {
      fs.mkdirSync(summariesDir, { recursive: true });
    }
    const filename = `pr-${pull_number}-${String(commit_id).slice(0, 7)}-${Date.now()}.txt`;
    const filepath = path.join(summariesDir, filename);
    fs.writeFileSync(filepath, text, 'utf8');
    console.log(`📝 Human summary written to: ${filepath}`);
  } catch (err) {
    console.error('Failed to write human-readable summary file:', err);
  }
}

/**
 * Generates a structured analysis output with summary, inline suggestions, and confidence
 */
function generateStructuredAnalysis(filesReviewed, reviewComments, filesForSummary) {
  const concerns = [];
  const strengths = [];
  const categoryCount = {};

  // Categorize comments
  for (const comment of reviewComments) {
    const category = detectCategory(comment.body);
    categoryCount[category] = (categoryCount[category] || 0) + 1;

    // Add to concerns if it's a real issue
    if (category !== 'Uncategorized') {
      const summary = comment.body.substring(0, 100);
      if (!concerns.includes(summary)) {
        concerns.push(summary);
      }
    }
  }

  // Determine strengths based on review
  if (reviewComments.length === 0) {
    strengths.push("Code review shows no critical issues");
  }
  if (filesReviewed.length > 0) {
    strengths.push(`Good separation of concerns (${filesReviewed.length} files reviewed)`);
  }
  if (!concerns.some(c => c.includes('Security'))) {
    strengths.push("No security vulnerabilities detected");
  }

  // Calculate confidence based on number of comments and categories
  let confidence = "high";
  if (reviewComments.length === 0) {
    confidence = "medium";
  } else if (Object.keys(categoryCount).length > 3) {
    confidence = "low";
  }

  // Build inline suggestions from review comments
  const inlineSuggestions = reviewComments.map(comment => ({
    filePath: comment.path,
    lineStart: comment.position,
    lineEnd: comment.position,
    comment: comment.body
  }));

  // Create the structured output
  const structuredOutput = {
    summary: {
      overview: `This PR updates ${filesReviewed.length} file${filesReviewed.length !== 1 ? 's' : ''} with ${reviewComments.length} suggestion${reviewComments.length !== 1 ? 's' : ''}. ` +
        (reviewComments.length === 0
          ? "Code review analysis indicates good quality with no major issues identified."
          : `Key areas of focus include ${Object.keys(categoryCount).join(', ')}.`),
      strengths: strengths.length > 0 ? strengths : ["Code is well-structured"],
      concerns: concerns.length > 0 ? concerns.slice(0, 5) : []
    },
    inlineSuggestions,
    confidence
  };

  return structuredOutput;
}

/**
 * Writes the structured analysis output to a JSON file
 */
function writeStructuredAnalysis(owner, repo, pull_number, commit_id, analysis) {
  const summariesDir = path.join(process.cwd(), 'summaries');
  try {
    if (!fs.existsSync(summariesDir)) {
      fs.mkdirSync(summariesDir, { recursive: true });
    }
    const filename = `pr-${pull_number}-${String(commit_id).slice(0, 7)}-structured-${Date.now()}.json`;
    const filepath = path.join(summariesDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(analysis, null, 2), 'utf8');
    console.log(`📊 Structured analysis written to: ${filepath}`);
  } catch (err) {
    console.error('Failed to write structured analysis file:', err);
  }
}

// -------------------------------------------------
// CORE REVIEW LOGIC
// -------------------------------------------------

/**
 * Runs AI review on a pull request using user's GitHub token
 */
async function runReview(payload, connectedRepo) {
  console.log("🤖 Starting AI Review (Inline)...");
  
  const owner = payload.repository.owner.login;
  const repo = payload.repository.name;
  const pull_number = payload.pull_request.number;
  const commit_id = payload.pull_request.head.sha;

  let allReviewComments = [];
  let filesReviewed = [];
  let filesForSummary = [];
  const changeTimestamp = payload?.pull_request?.updated_at || new Date().toISOString();

  try {
    // Initialize Octokit with user's access token
    const octokit = new Octokit({
      auth: connectedRepo.userId.accessToken,
    });

    // Get the diff for the PR
    const diffResponse = await octokit.pulls.get({
      owner,
      repo,
      pull_number,
      mediaType: { format: "diff" }
    });
    const diff = diffResponse.data;
    const files = parseDiff(diff);

    // Loop through each file in the diff
    for (const file of files) {
      if (!file.to) continue; // Skip deleted files

      console.log(`Checking file: ${file.to}`);

      // Format the diff with line numbers for the AI
      let diffForAI = `File: ${file.to}\n`;
      let additions = [];
      let hasAdditions = false;
      let currentLineNumber = 0;

      for (const chunk of file.chunks) {
        diffForAI += "...\n"; // Context break
        if (chunk.newStart) {
          currentLineNumber = chunk.newStart;
        }

        for (const change of chunk.changes) {
          if (change.type === 'add') {
            let lineNum = change.ln || currentLineNumber || 1;

            diffForAI += `L${lineNum}: ${change.content}\n`;
            additions.push({ line: lineNum, text: change.content });
            hasAdditions = true;

            if (!change.ln && currentLineNumber) {
              currentLineNumber++;
            } else if (change.ln) {
              currentLineNumber = change.ln + 1;
            }
          } else if (change.type === 'normal') {
            if (change.ln2) {
              currentLineNumber = change.ln2 + 1;
            } else if (currentLineNumber) {
              currentLineNumber++;
            }
          }
        }
      }

      // Create the prompt for AI review
      const prompt = `
        You are a senior code reviewer with expertise in software development best practices, security, and performance optimization.
        
        **TASK**: Review the code changes in the file: \`${file.to}\`
        
        **CONTEXT**: 
        - Only added lines (prefixed with line numbers like "L15: ...") should be reviewed
        - Context lines (unchanged) and deleted lines (-) are shown for reference only
        - Focus on: bugs, security vulnerabilities, performance issues, code quality, best practices, and potential improvements
        
        **REVIEW CRITERIA**:
        1. **Security**: Check for vulnerabilities (injection flaws, exposed secrets, insecure dependencies)
        2. **Bugs**: Identify potential runtime errors, edge cases, or logical issues
        3. **Performance**: Flag inefficient algorithms, memory leaks, or unnecessary operations
        4. **Code Quality**: Check for readability, maintainability, proper naming conventions
        5. **Best Practices**: Ensure adherence to language-specific standards and patterns
        6. **Error Handling**: Verify proper error handling and edge case management
        
        **OUTPUT FORMAT** - Respond ONLY with a valid JSON array:
        [
          { "line": <line_number>, "comment": "<category>: <clear_concise_feedback>" }
        ]
        
        **CRITICAL RULES**:
        1. ONLY comment on lines with a line number prefix (e.g., "L15: ...")
        2. The "line" value MUST be a NUMBER matching the line number from the diff (e.g., 15, not "L15")
        3. Each comment MUST start with a category prefix: [Security], [Bug], [Performance], [Quality], [Best Practice], or [Error Handling]
        4. Comments should be specific, actionable, and concise (1-2 sentences)
        5. If NO issues found in added lines, return an empty array: []
        6. Do NOT include markdown code blocks in your response, ONLY the JSON array
        
        **EXAMPLES**:
        Good: [{"line": 15, "comment": "[Security]: Potential SQL injection vulnerability. Use parameterized queries instead of string concatenation."}]
        Good: [{"line": 22, "comment": "[Performance]: Array.find() inside a loop causes O(n²) complexity. Consider using a Map for O(n) lookup."}]
        Bad: [{"line": "L15", "comment": "issue here"}] // Line must be a number, comment lacks category and detail
        
        **CODE CHANGES**:
        \`\`\`diff
        ${diffForAI}
        \`\`\`
        
        Remember: Respond ONLY with the JSON array. No explanations, no markdown formatting, just the raw JSON.`;

      // Call AI with retry logic
      const fileComments = await getAIReviewForFile(prompt);
      filesReviewed.push(file.to);

      // Format comments for GitHub API
      if (fileComments.length > 0) {
        for (const item of fileComments) {
          if (item.line && item.comment) {
            const lineNumber = parseInt(String(item.line).replace(/\D/g, ''), 10);
            if (!isNaN(lineNumber)) {
              allReviewComments.push({
                path: file.to,
                position: lineNumber,
                body: item.comment
              });
            } else {
              console.warn(`Skipping comment, AI returned invalid line: ${item.line}`);
            }
          } else if (item.comment) {
            console.warn(`Skipping comment, AI forgot 'line' property for: "${item.comment}"`);
          }
        }
      }

      filesForSummary.push({ path: file.to, diff: diffForAI, additions, timestamp: changeTimestamp });
    } // End of file loop

    // Post the final, consolidated review
    let reviewBody;
    let reviewEvent;

    if (allReviewComments.length > 0) {
      reviewEvent = "REQUEST_CHANGES";
      reviewBody = "AI review complete. Found some potential issues, please see the inline comments.";
    } else {
      reviewEvent = "COMMENT";
      reviewBody = "AI review complete. Looks good to me!";
    }

    // Write local summaries before posting review
    writeSummary(owner, repo, pull_number, commit_id, filesReviewed, allReviewComments);

    const structuredAnalysis = generateStructuredAnalysis(filesReviewed, allReviewComments, filesForSummary);
    writeStructuredAnalysis(owner, repo, pull_number, commit_id, structuredAnalysis);

    // Generate and write human-readable text summary
    const commentsByFile = allReviewComments.reduce((acc, c) => {
      acc[c.path] = (acc[c.path] || 0) + 1;
      return acc;
    }, {});
    const textSummary = await generatePRTextSummary({
      owner,
      repo,
      pull_number,
      totalFilesChanged: filesForSummary.length,
      filesForSummary,
      commentsByFile,
      totalComments: allReviewComments.length
    });
    writeTextSummary(owner, repo, pull_number, commit_id, textSummary);

    // Post review to GitHub
    await octokit.pulls.createReview({
      owner,
      repo,
      pull_number,
      commit_id,
      body: reviewBody,
      event: reviewEvent,
      comments: allReviewComments
    });

    console.log("✅ 🤖 AI Review Complete. Posted inline comments.");
  } catch (error) {
    console.error("❌ Error during inline AI review:", error.message);
    
    // Attempt to write an error summary
    try {
      writeSummary(owner, repo, pull_number, commit_id, [], []);
      writeTextSummary(
        owner,
        repo,
        pull_number,
        commit_id,
        `Pull request overview\nAn error occurred during AI review: ${error.message}\n\nReviewed changes\nNo inline comments were posted due to the error.`
      );
    } catch {}

    // Post error comment to PR
    try {
      const octokit = new Octokit({
        auth: connectedRepo.userId.accessToken,
      });
      await octokit.issues.createComment({
        owner,
        repo,
        issue_number: pull_number,
        body: `🤖 AI Review Error: I encountered an error and couldn't post inline comments. \n\n\`${error.message}\``
      });
    } catch (commentErr) {
      console.error("Failed to post error comment:", commentErr.message);
    }
  }
}

module.exports = { runReview };
