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

    // Deterministic overview and key metrics
    const totalAddedLines = filesForSummary.reduce((sum, f) => sum + (f.additions?.length || 0), 0);
    const fileNames = filesForSummary.map(f => f.path).join(', ');

    // Build an ASCII table of files changed
    const header = `| File | Added Lines | Comments |\n|---|---:|---:|`;
    const rows = filesForSummary.map(f => {
      const added = f.additions?.length || 0;
      const comments = commentsByFile?.[f.path] || 0;
      return `| ${f.path} | ${added} | ${comments} |`;
    }).join('\n');
    const filesChangedTable = [header, rows].join('\n');

    // Per-file one-line description (deterministic)
    const perFileOneLiners = filesForSummary.map(f => {
      const added = f.additions?.length || 0;
      const desc = added > 0 ? `Added ${added} line${added === 1 ? '' : 's'}.` : 'No added lines.';
      return `${f.path}: ${desc}`;
    }).join('\n');

    // Per-line deterministic summaries
    const perLineDeterministic = filesForSummary.map(f => {
      const lines = (f.additions || []).map(a => {
        const lineLabel = a.line == null ? '?' : String(a.line);
        const text = String(a.text || '').trim();
        return `L${lineLabel}: Adds '${text}'`;
      });
      return [`File: ${f.path}`, ...lines].join('\n');
    }).join('\n\n');

    // Input for AI per-file summaries (uses only added lines)
    const perFileLineInput = filesForSummary
      .map(f => {
        const lines = (f.additions || []).map(a => {
          const lineLabel = a.line == null ? '?' : String(a.line);
          const text = String(a.text || '').trim();
          return `L${lineLabel}: ${text}`;
        }).join('\n');
        return `File: ${f.path}\n${lines}`;
      })
      .join('\n\n');

    // Changes by file and line (deterministic, with timestamps)
    const perFileLineDetails = filesForSummary.map(f => {
      const ts = f.timestamp || tsNow;
      const headerLine = `File: ${f.path}`;
      const entries = (f.additions || []).map(a => {
        const lineLabel = a.line == null ? '?' : String(a.line);
        return `  - L${lineLabel} @ ${ts}: ${a.text}`;
      });
      return [headerLine, ...entries].join('\n');
    }).join('\n\n');

    // Diff blocks with proper line numbers (should not have undefined anymore)
    const perFileDiffBlocks = filesForSummary.map(f => {
      const cleaned = String(f.diff || '');
      return `File: ${f.path}\n\n\`\`\`diff\n${cleaned}\n\`\`\``;
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
        const added = f.additions?.length || 0;
        const firstLine = (f.additions || [])[0]?.text;
        const hint = firstLine ? `Highlights: '${String(firstLine).trim()}'` : 'No specific highlight available.';
        return `File: ${f.path}\nSummary: Added ${added} line${added === 1 ? '' : 's'}. ${hint}`;
      }).join('\n\n');
    }

    // Assemble final text
    const pieces = [];
    pieces.push('Pull Request Summary');
    pieces.push('');
    pieces.push(`This pull request updates ${filesForSummary.length} files in ${owner}/${repo} (PR #${pull_number}).`);
    pieces.push(`Added ${totalAddedLines} line${totalAddedLines === 1 ? '' : 's'} across: ${fileNames || 'no files'}.`);
    pieces.push('');
    pieces.push('Key Changes (deterministic)');
    pieces.push(`- Reviewed ${filesForSummary.length} out of ${totalFilesChanged} changed files.`);
    pieces.push(`- Generated ${totalComments} inline comment${totalComments === 1 ? '' : 's'}.`);
    pieces.push(`- Focused on newly added lines only.`);
    pieces.push('');
    pieces.push('Files Changed (table)');
    pieces.push(filesChangedTable);
    pieces.push('');
    pieces.push('Summary For Each File');
    pieces.push(aiPerFileSummaries);
    pieces.push('');
    pieces.push('Summary Per File');
    pieces.push(perFileOneLiners);
    pieces.push('');
    pieces.push('Per-line change summary');
    pieces.push(perLineDeterministic);
    pieces.push('');
    pieces.push('Changes by file and line (deterministic)');
    pieces.push(perFileLineDetails);
    pieces.push('');
    pieces.push('Here are the diffs for context (only added lines are prefixed with line numbers):');
    pieces.push(perFileDiffBlocks);
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

module.exports = { callMyAI, getAIReviewForFile, generatePRTextSummary };
