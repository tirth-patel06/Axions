const { GoogleGenerativeAI } = require("@google/generative-ai");

// -------------------------------------------------
// 1. AUTHENTICATE AI CLIENT
// -------------------------------------------------
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const aiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

// -------------------------------------------------
// 2. AI CALLER FUNCTIONS
// -------------------------------------------------
/**
 * Calls the AI with a prompt and returns the response text
 */
async function callMyAI(prompt) {
  try {
    console.log("... 🤖 Calling Gemini AI ...");
    const result = await aiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log("... 🤖 AI Response Received ...");
    return text;
  } catch (error) {
    console.error("❌ Error calling Gemini AI:", error);
    return "[]"; // Return an empty JSON array string on error
  }
}

/**
 * Calls the AI, parses the response, and validates the schema.
 * Retries up to 3 times if the AI response is invalid.
 */
async function getAIReviewForFile(prompt, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`... AI Attempt ${attempt}/${maxRetries} for file...`);
    const aiResponse = await callMyAI(prompt); // Assumes callMyAI returns "[]" on error

    try {
      // 1. Parse the JSON
      let fileComments = [];
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/);
      
      if (jsonMatch && jsonMatch[1]) {
        fileComments = JSON.parse(jsonMatch[1]);
      } else {
        fileComments = JSON.parse(aiResponse);
      }

      // 2. Validate the Schema
      if (!Array.isArray(fileComments)) {
        throw new Error("AI response was not a JSON array.");
      }
      
      // Check if every item in the array is valid
      for (const item of fileComments) {
        // If it's not an empty array, it MUST have both line and comment
        if (Object.keys(item).length > 0) {
          if (item.line === undefined || item.comment === undefined) {
            // This is what caused your 'undefined' error
            throw new Error(`AI item missing 'line' or 'comment': ${JSON.stringify(item)}`);
          }
        }
      }

      // 3. If valid, return the data!
      console.log(`... AI Attempt ${attempt} SUCCEEDED.`);
      return fileComments; 

    } catch (e) {
      // 4. If parsing or validation fails, log and retry
      console.warn(`AI Attempt ${attempt} FAILED: ${e.message}`);
      console.warn("AI Response was:", aiResponse);
      if (attempt === maxRetries) {
        console.error("Max retries reached. AI failed to provide valid JSON.");
        return []; // Give up
      }
    }
  }
  return []; // Fallback
}

/**
 * Generates a PR text summary with AI assistance
 */
async function generatePRTextSummary({ owner, repo, pull_number, totalFilesChanged, filesForSummary, commentsByFile, totalComments }) {
  try {
    const tsNow = new Date().toISOString();

    // Extract added lines from chunks (parse-diff structure)
    const extractAddedLines = (file) => {
      const added = [];
      if (file.chunks && Array.isArray(file.chunks)) {
        file.chunks.forEach(chunk => {
          if (chunk.changes && Array.isArray(chunk.changes)) {
            chunk.changes.forEach(change => {
              if (change.add === true) {
                added.push({
                  line: change.ln,
                  text: change.content
                });
              }
            });
          }
        });
      }
      return added;
    };

    // Get file path from parse-diff structure
    const getFilePath = (file) => {
      return file.to || file.from || 'unknown';
    };

    // Deterministic overview and key metrics
    const totalAddedLines = filesForSummary.reduce((sum, f) => sum + extractAddedLines(f).length, 0);
    const fileNames = filesForSummary.map(f => getFilePath(f)).join(', ');

    // Build an ASCII table of files changed
    const header = `| File | Added Lines | Comments |\n|---|---:|---:|`;
    const rows = filesForSummary.map(f => {
      const filePath = getFilePath(f);
      const added = extractAddedLines(f).length;
      const comments = commentsByFile?.[filePath] || 0;
      return `| ${filePath} | ${added} | ${comments} |`;
    }).join('\n');
    const filesChangedTable = [header, rows].join('\n');

    // Per-file one-line description (deterministic)
    const perFileOneLiners = filesForSummary.map(f => {
      const filePath = getFilePath(f);
      const added = extractAddedLines(f).length;
      const desc = added > 0 ? `Added ${added} line${added === 1 ? '' : 's'}.` : 'No added lines.';
      return `${filePath}: ${desc}`;
    }).join('\n');

    // Per-line deterministic summaries
    const perLineDeterministic = filesForSummary.map(f => {
      const filePath = getFilePath(f);
      const addedLines = extractAddedLines(f);
      const lines = addedLines.map(a => {
        const lineLabel = a.line == null ? '?' : String(a.line);
        const text = String(a.text || '').trim();
        return `L${lineLabel}: Adds '${text}'`;
      });
      return [`File: ${filePath}`, ...lines].join('\n');
    }).join('\n\n');

    // Input for AI per-file summaries (uses only added lines)
    const perFileLineInput = filesForSummary
      .map(f => {
        const filePath = getFilePath(f);
        const addedLines = extractAddedLines(f);
        const lines = addedLines.map(a => {
          const lineLabel = a.line == null ? '?' : String(a.line);
          const text = String(a.text || '').trim();
          return `L${lineLabel}: ${text}`;
        }).join('\n');
        return `File: ${filePath}\n${lines}`;
      })
      .join('\n\n');

    // Changes by file and line (deterministic, with timestamps)
    const perFileLineDetails = filesForSummary.map(f => {
      const filePath = getFilePath(f);
      const ts = f.timestamp || tsNow;
      const headerLine = `File: ${filePath}`;
      const addedLines = extractAddedLines(f);
      const entries = addedLines.map(a => {
        const lineLabel = a.line == null ? '?' : String(a.line);
        return `  - L${lineLabel} @ ${ts}: ${a.text}`;
      });
      return [headerLine, ...entries].join('\n');
    }).join('\n\n');

    // Diff blocks with proper line numbers (should not have undefined anymore)
    const perFileDiffBlocks = filesForSummary.map(f => {
      const filePath = getFilePath(f);
      const cleaned = String(f.diff || '');
      return `File: ${filePath}\n\n\`\`\`diff\n${cleaned}\n\`\`\``;
    }).join('\n\n');

    // AI-generated summaries per file (constrained, with fallback)
    let aiPerFileSummaries = '';
    try {
      const perFilePrompt = `You are an expert reviewer. Summarize WHAT changed for EACH file based ONLY on the added lines provided.\n\n` +
        `Output EXACTLY in this format for every file:\n` +
        `File: <path>\nSummary: <one concise sentence (max 2)>\n\n` +
        `Avoid code fences and extra prose. Do not invent changes beyond the lines shown.\n\n` +
        `${perFileLineInput}`;
      const aiText = await callMyAI(perFilePrompt);
      aiPerFileSummaries = String(aiText).replace(/```[\s\S]*?```/g, '').trim();
    } catch {
      aiPerFileSummaries = filesForSummary.map(f => {
        const filePath = getFilePath(f);
        const addedLines = extractAddedLines(f);
        const added = addedLines.length;
        const firstLine = addedLines[0]?.text;
        const hint = firstLine ? `Highlights: '${String(firstLine).trim()}'` : 'No specific highlight available.';
        return `File: ${filePath}\nSummary: Added ${added} line${added === 1 ? '' : 's'}. ${hint}`;
      }).join('\n\n');
    }

    // Assemble final text - Clean, user-friendly format
    const pieces = [];
    pieces.push('## PR Review Summary');
    pieces.push('');
    pieces.push(`✅ **Reviewed ${filesForSummary.length} file${filesForSummary.length === 1 ? '' : 's'}** with ${totalComments} inline comment${totalComments === 1 ? '' : 's'}`);
    pieces.push('');
    pieces.push('### Changes by File');
    pieces.push(filesChangedTable);
    pieces.push('');
    pieces.push('### Analysis');
    pieces.push(aiPerFileSummaries);
    return pieces.join('\n');
  } catch (err) {
    console.warn('Text summary generation failed, falling back to basic summary:', err.message);
    const lines = [];
    lines.push('Pull Request Summary');
    lines.push('');
    lines.push(`This pull request updates ${filesForSummary.length} files in ${owner}/${repo} (PR #${pull_number}).`);
    lines.push(`Reviewed ${filesForSummary.length} out of ${totalFilesChanged} changed files and generated ${totalComments} comments.`);
    lines.push('');
    lines.push('Summary Per File');
    for (const f of filesForSummary) {
      const added = f.additions?.length || 0;
      lines.push(`${f.path}: ${added > 0 ? `Added ${added} line${added === 1 ? '' : 's'}.` : 'No added lines.'}`);
    }
    lines.push('');
    lines.push('Per-line change summary');
    for (const f of filesForSummary) {
      lines.push(`File: ${f.path}`);
      for (const a of (f.additions || [])) {
        const lineLabel = a.line == null ? '?' : String(a.line);
        lines.push(`L${lineLabel}: Adds '${String(a.text || '').trim()}'`);
      }
      lines.push('');
    }
    return lines.join('\n');
  }
}

/**
 * Analyzes a parsed diff and returns structured review data
 * 
 * @param {Array} parsedFiles - Array of parsed file objects from parse-diff
 * @returns {Promise<Object>} Structured analysis with inlineComments, summary, confidence
 */
async function analyzeDiff(parsedFiles) {
  const filesAnalyzed = [];
  const inlineComments = [];

  for (const file of parsedFiles) {
    if (!file.to) continue; // Skip deleted files

    filesAnalyzed.push(file.to);

    // Format diff with line numbers
    let diffForAI = `File: ${file.to}\n`;
    let currentLineNumber = 0;

    for (const chunk of file.chunks) {
      diffForAI += "...\n";
      if (chunk.newStart) {
        currentLineNumber = chunk.newStart;
      }

      for (const change of chunk.changes) {
        if (change.type === 'add') {
          const lineNum = change.ln || currentLineNumber || 1;
          diffForAI += `L${lineNum}: ${change.content}\n`;
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

    // Create prompt for AI review
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

    // Get AI review for this file
    const fileComments = await getAIReviewForFile(prompt);

    // Format comments for GitHub API
    if (fileComments && fileComments.length > 0) {
      for (const item of fileComments) {
        if (item.line && item.comment) {
          const lineNumber = parseInt(String(item.line).replace(/\D/g, ''), 10);
          if (!isNaN(lineNumber)) {
            inlineComments.push({
              path: file.to,
              position: lineNumber,
              body: item.comment
            });
          }
        }
      }
    }
  }

  // Calculate summary and confidence
  const summary = inlineComments.length === 0
    ? `Analyzed ${filesAnalyzed.length} file(s). No issues detected.`
    : `Analyzed ${filesAnalyzed.length} file(s). Found ${inlineComments.length} suggestion(s).`;

  const confidence = inlineComments.length === 0 ? 'high' : 
                   inlineComments.length < 5 ? 'high' : 
                   inlineComments.length < 15 ? 'medium' : 'low';

  return {
    filesAnalyzed,
    totalFilesReviewed: filesAnalyzed.length,
    inlineComments,
    summary,
    confidence,
    stats: {
      totalComments: inlineComments.length,
      totalFiles: filesAnalyzed.length
    }
  };
}

module.exports = { callMyAI, getAIReviewForFile, generatePRTextSummary, analyzeDiff };
