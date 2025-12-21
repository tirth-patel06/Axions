import { App } from "@octokit/app";
import { Octokit } from "@octokit/rest";
import { createNodeMiddleware } from "@octokit/webhooks";
import express from "express";
import SmeeClient from 'smee-client';
import parseDiff from 'parse-diff';
import fs from 'fs';
import path from 'path';
import { getAIReviewForFile, generatePRTextSummary } from './llmService.js';

// -------------------------------------------------
// 1. AUTHENTICATE GITHUB APP
// -------------------------------------------------
const app = new App({
  appId: '',
  privateKey: "-----BEGIN RSA PRIVATE KEY-----\nMIIEpQIBAAKCAQEAxqdg4uScVx6nZXNQk2dUM08i7q7Ig4KwMkRSw4XzE07cTO/8\n6FZThyjdXqP06fy0PMlEbCPFWMJ4+h2CizvYmbV2PKu99NCbkdKoPAJAKj3TfdXO\nlE2yCJ328fDJUiCjpAMqx2Pow2Jf5iWcgqWHaMPvsMUOZarGmAFxCI2vJ6bSJfki\n6TusOMQhuEygEp8cT2v+LcE0WDPwW37nmSbLAIQBKS9w6mlefF2jQP4lYm2kdAKu\nrOkKEbgpCakqdG21s4s0LTCaxGh5yXG+orrn8bghu5ROx2PuCDrJhPWOGngQIU9Y\nFy3yFcNE3md72puVcXjDu4seFrqRT7mJm9zTDQIDAQABAoIBAQCZcN2wQ77SuBW6\nkeiSAsUR4LVtwUmV8xMfsJBw//zyU/5r2w7xcwSPqKvcly3sskmRjjCwiqy7U3NY\nVgTogPBcQcKzOEDAYYVYjGtv9pkTR7AdSVGIUb8LUuBUnpUSP63GWL/pRS2cBVdn\nkHOkojDGZlm0o3DsbI17CdoCLlY1fBFJKDu5cImCqFWuKpFHv7fKkxNRZh59PK6p\nXd5IBMcyDIynd4pE7TDa2nAyFvgrZCglucbjKahTVXAlWi3HbMcBC/wIZFHg0Ny9\n7NiPcNAYDZ628yYJZWkXeEo/SXb3gSUNmHmsBqzdHAMeZNrLR1qK3vke1v7R59Pl\n/rMnxdFBAoGBAP+PrIo1J9Ak+qc+S9TxJCh5LK3mAA9+Kfwx4MDZWLUciT750Rx3\n+LdGgLu4awIwGcJDr9wEKIV6gnT8Vh9HwZiOurQUctrUfBf3K2UFc17dtomcjtkz\nlleCcn8FdCu6QTkQ/KFC1pcILcyBICKyickqu/4/RBvZmjHnNimaY7bdAoGBAMb+\nsTCNYO522RkvDzGwYZz9AZyCjV0r/WHRPuqIqorhH53o4/eqXDFgrj8dxWjiAfrJ\nm3n3bIkoSBGQy2TcV1KlC2vZzsk7TAqFK3+9NB5CyBhbx3K2VNCUaTEmBReqh3BS\nvdbapp4Y6aAuwLCE0AUeNNq8mWRfwTuWzb2ALRHxAoGBAK7/Zin5vjqEp/MP8INv\nYNAqMdMetRnmzb85NGs6KclTMhQiovO4n2J477wby4LjBzCEgw7I9ip4uo57IEop\nK8NYsTaQ7hk0+Yi7o0Z41gi3D8DpqNPIxIFF/TtHs8Yhs3ntTODsUN95JUttfGDm\nGv3auoKeNfhQKItVhTw10WQtAoGAYYyzUejMjrnGPTk7ipE7mNjSdGXvZLBO2yfX\nXuO2LrSjaiajsmJaJX6OjLRMdNjuPYGdbRHkq+wKQEop2vzE9eegjLNOUol2AmY7\n57fZl8gHDSHYyRwmwcUvN/+6WVqoYGC/XVb8fN4bkQG6Rg4lZ4ziPiRcUb87G7oW\ni4INFhECgYEAkPsyRrm2l535g7lbN8RAiRDhu95FYELtsGtbEZmOiT/eXCAxoG0r\n2xQOwHA/g12vFaGhfgVXaMhoQQYZWg0fK77k1ni6mT8kGGw2AQH6FbYxDJ9dvW+g\nre8p5jNm7mzUzx1C38ocJ2Su5WITVtWu+At7JeZg9EeJz6WjbljDh+U=\n-----END RSA PRIVATE KEY-----\n",
  webhooks: {
    secret: 'secre'
  },
  Octokit: Octokit,
});

// Smee.io Client Setup
const smee = new SmeeClient({
  source: 'https://smee.io/6bsWMEfFdOWryZ1z',
  target: 'http://localhost:3000/api/webhooks',
  logger: console
});
const events = smee.start();

// -------------------------------------------------
// 2. UTILITY FUNCTIONS
// -------------------------------------------------
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

    const filename = `pr-${pull_number}-${String(commit_id).slice(0,7)}-${Date.now()}.json`;
    const filepath = path.join(summariesDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(payload, null, 2), 'utf8');
    console.log(`📄 Summary written to: ${filepath}`);
  } catch (err) {
    console.error('Failed to write summary file:', err);
  }
}

function writeTextSummary(owner, repo, pull_number, commit_id, text) {
  const summariesDir = path.join(process.cwd(), 'summaries');
  try {
    if (!fs.existsSync(summariesDir)) {
      fs.mkdirSync(summariesDir, { recursive: true });
    }
    const filename = `pr-${pull_number}-${String(commit_id).slice(0,7)}-${Date.now()}.txt`;
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
  // Extract unique concerns and strengths from comments
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
    confidence = "medium"; // Few comments = medium confidence
  } else if (Object.keys(categoryCount).length > 3) {
    confidence = "low"; // Many different issue types = lower confidence
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
      concerns: concerns.length > 0 ? concerns.slice(0, 5) : [] // Limit to top 5 concerns
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
    const filename = `pr-${pull_number}-${String(commit_id).slice(0,7)}-structured-${Date.now()}.json`;
    const filepath = path.join(summariesDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(analysis, null, 2), 'utf8');
    console.log(`📊 Structured analysis written to: ${filepath}`);
  } catch (err) {
    console.error('Failed to write structured analysis file:', err);
  }
}

// -------------------------------------------------
// 3. CORE REVIEW LOGIC
// -------------------------------------------------
async function runReview(octokit, payload) {
  console.log("🤖 Starting AI Review (Inline)...");
  const owner = payload.repository.owner.login;
  const repo = payload.repository.name;
  const pull_number = payload.pull_request.number;

  // 1. REQUIRED: Get the commit SHA for inline comments
  const commit_id = payload.pull_request.head.sha;

  // This array will hold all our inline comment objects
  let allReviewComments = [];
  let filesReviewed = [];
  let filesForSummary = [];
  const changeTimestamp = payload?.pull_request?.updated_at || new Date().toISOString();

  try {
    // 2. Get the diff for the PR
    const diffResponse = await octokit.pulls.get({
      owner,
      repo,
      pull_number,
      mediaType: { format: "diff" }
    });
    const diff = diffResponse.data;
    const files = parseDiff(diff);

    // 3. Loop through each file in the diff
    for (const file of files) {
      if (!file.to) continue; // Skip deleted files

      console.log(`Checking file: ${file.to}`);

      // 4. Format the diff with line numbers for the AI
      let diffForAI = `File: ${file.to}\n`;
      let additions = [];
      let hasAdditions = false;
      let currentLineNumber = 0;

      for (const chunk of file.chunks) {
        diffForAI += "...\n"; // Context break
        // Initialize line number from chunk header if available
        if (chunk.newStart) {
          currentLineNumber = chunk.newStart;
        }

        for (const change of chunk.changes) {
          // Track line numbers manually
          if (change.type === 'add') {
            // For added lines, parse-diff uses 'ln' property
            let lineNum = change.ln || currentLineNumber || 1;
            
            diffForAI += `L${lineNum}: ${change.content}\n`;
            additions.push({ line: lineNum, text: change.content });
            hasAdditions = true;
            
            // Increment for next line if tracking manually
            if (!change.ln && currentLineNumber) {
              currentLineNumber++;
            } else if (change.ln) {
              currentLineNumber = change.ln + 1;
            }
          } else if (change.type === 'normal') {
            // Track normal lines - they have both ln1 and ln2, use ln2 for new file
            if (change.ln2) {
              currentLineNumber = change.ln2 + 1;
            } else if (currentLineNumber) {
              currentLineNumber++;
            }
          }
        }
      }

      // 6. Create the new, structured JSON prompt
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

      // 7. Call AI with retry logic and parse/validate the response
      const fileComments = await getAIReviewForFile(prompt);
      filesReviewed.push(file.to);

      // 8. Format comments for GitHub API and add to main array
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

      // collect file info for text summary
      filesForSummary.push({ path: file.to, diff: diffForAI, additions, timestamp: changeTimestamp });
    } // End of file loop

    // 9. Post the final, consolidated review
    let reviewBody;
    let reviewEvent;

    if (allReviewComments.length > 0) {
      reviewEvent = "REQUEST_CHANGES";
      reviewBody = "AI review complete. Found some potential issues, please see the inline comments.";
    } else {
      reviewEvent = "COMMENT"; // Use COMMENT, not APPROVE
      reviewBody = "AI review complete. Looks good to me!";
    }

    // Write local JSON summary before posting review
    writeSummary(owner, repo, pull_number, commit_id, filesReviewed, allReviewComments);

    // Generate and write structured analysis
    const structuredAnalysis = generateStructuredAnalysis(filesReviewed, allReviewComments, filesForSummary);
    writeStructuredAnalysis(owner, repo, pull_number, commit_id, structuredAnalysis);

    // Prepare and write a human-readable text summary
    const totalFilesChanged = filesForSummary.length;
    const commentsByFile = allReviewComments.reduce((acc, c) => {
      acc[c.path] = (acc[c.path] || 0) + 1;
      return acc;
    }, {});
    const textSummary = await generatePRTextSummary({
      owner,
      repo,
      pull_number,
      totalFilesChanged,
      filesForSummary,
      commentsByFile,
      totalComments: allReviewComments.length
    });
    writeTextSummary(owner, repo, pull_number, commit_id, textSummary);

    await octokit.pulls.createReview({
      owner,
      repo,
      pull_number,
      commit_id, // The head SHA is required
      body: reviewBody,
      event: reviewEvent,
      comments: allReviewComments // Pass the array of inline comments
    });

    console.log("✅ 🤖 AI Review Complete. Posted inline comments.");
  } catch (error) {
    console.error("❌ Error during inline AI review:", error.message);
    // Attempt to write an error summary as well
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
    // Add a fallback comment to the PR issue
    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: pull_number,
      body: `🤖 AI Review Error: I encountered an error and couldn't post inline comments. \n\n\`${error.message}\``
    });
  }
}

// -------------------------------------------------
// 4. WEBHOOK LISTENERS
// -------------------------------------------------
app.webhooks.on("pull_request.opened", async (context) => {
  console.log("✅ 'pull_request.opened' event received!");
  console.log('Does context.octokit.pulls exist?', context.octokit.pulls ? 'Yes' : context);
  // `context.octokit` is a pre-authenticated client for THIS installation
  await runReview(context.octokit, context.payload);
});

app.webhooks.on("pull_request.synchronize", async (context) => {
  console.log("✅ 'pull_request.synchronize' event received (new push)!");
  await runReview(context.octokit, context.payload);
});

app.webhooks.onAny(async (context) => {
  const action = context.payload.action ? `.${context.payload.action}` : '';
  console.log(`(FYI: Received '${context.name}${action}' event)`);
});

app.webhooks.onError((error) => {
  console.error("Verification failed:", error);
});

// -------------------------------------------------
// 5. SERVER SETUP
// -------------------------------------------------
const expressApp = express(); // Renamed to avoid confusion with the GitHub `app`
const port = 3000;

// Use the app's built-in middleware
expressApp.use(createNodeMiddleware(app.webhooks, { path: '/api/webhooks' }));

expressApp.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
  console.log("Smee.io client is now running and forwarding events.");
});

export { app, runReview };
