const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = __dirname;
const STUDENTS_DIR = path.join(ROOT, 'students');
const ANSWER_FILE = path.join(ROOT, 'answer.R');
const RESULTS_DIR = path.join(ROOT, 'results');
const RESULTS_CSV = path.join(RESULTS_DIR, 'results.csv');
const TIMEOUT_MS = 5000;

function ensureResultsDir() {
  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }
}

function runRCmdBatch(scriptPath) {
  const parsed = path.parse(scriptPath);
  const outPath = path.join(parsed.dir, `${parsed.name}.Rout`);

  if (fs.existsSync(outPath)) {
    fs.unlinkSync(outPath);
  }

  const result = spawnSync(
    'R',
    ['CMD', 'BATCH', scriptPath, outPath],
    {
      encoding: 'utf-8',
      timeout: TIMEOUT_MS,
      windowsHide: true,
    }
  );

  return {
    status: result.status,
    signal: result.signal,
    error: result.error,
    stdout: result.stdout,
    stderr: result.stderr,
    outPath,
  };
}

function extractMeaningfulOutput(rawText) {
  let text = rawText.replace(/\r\n/g, '\n');

  const firstPromptIndex = text.search(/^>/m);
  if (firstPromptIndex !== -1) {
    text = text.slice(firstPromptIndex);
  }

  text = text.replace(/\n> proc\.time\(\)[\s\S]*$/m, '');

  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
}

function normalizeOutput(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim();
}

function readCleanOutput(routPath) {
  if (!fs.existsSync(routPath)) {
    return null;
  }

  const raw = fs.readFileSync(routPath, 'utf-8');
  const meaningful = extractMeaningfulOutput(raw);
  return normalizeOutput(meaningful);
}

function escapeCsv(value) {
  const s = String(value ?? '');
  if (s.includes('"') || s.includes(',') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function writeResultsCsv(rows) {
  const header = ['filename', 'result', 'reason'];
  const lines = [header.join(',')];

  for (const row of rows) {
    lines.push([
      escapeCsv(row.filename),
      escapeCsv(row.result),
      escapeCsv(row.reason),
    ].join(','));
  }

  fs.writeFileSync(RESULTS_CSV, lines.join('\n'), 'utf-8');
}

function main() {
  ensureResultsDir();

  if (!fs.existsSync(ANSWER_FILE)) {
    console.error('answer.R 파일이 없습니다.');
    process.exit(1);
  }

  if (!fs.existsSync(STUDENTS_DIR)) {
    console.error('students 폴더가 없습니다.');
    process.exit(1);
  }

  console.log('정답 코드 실행 중...');
  const answerRun = runRCmdBatch(ANSWER_FILE);

  if (answerRun.error) {
    console.error('정답 코드 실행 실패:', answerRun.error.message);
    process.exit(1);
  }

  const answerOutput = readCleanOutput(answerRun.outPath);
  if (answerOutput == null) {
    console.error('정답 출력 파일을 읽을 수 없습니다.');
    process.exit(1);
  }

  const studentFiles = fs.readdirSync(STUDENTS_DIR)
    .filter(file => file.toLowerCase().endsWith('.r'))
    .sort();

  if (studentFiles.length === 0) {
    console.log('채점할 학생 .R 파일이 없습니다.');
    process.exit(0);
  }

  const results = [];
  let pass = 0;
  let failOrError = 0;

  for (const file of studentFiles) {
    const scriptPath = path.join(STUDENTS_DIR, file);
    const run = runRCmdBatch(scriptPath);

    let result = 'FAIL';
    let reason = 'Output Mismatch';

    if (run.error) {
      if (run.error.code === 'ETIMEDOUT') {
        result = 'ERROR';
        reason = 'Time Limit Exceeded';
      } else {
        result = 'ERROR';
        reason = `Execution Error: ${run.error.message}`;
      }
    } else {
      const studentOutput = readCleanOutput(run.outPath);

      if (studentOutput == null) {
        result = 'ERROR';
        reason = 'No Rout file generated';
      } else if (studentOutput === answerOutput) {
        result = 'PASS';
        reason = 'Matched';
      }
    }

    if (result === 'PASS') {
      pass += 1;
    } else {
      failOrError += 1;
    }

    results.push({
      filename: file,
      result,
      reason,
    });

    console.log(`${file} -> ${result} (${reason})`);
  }

  writeResultsCsv(results);

  console.log('\n채점 완료');
  console.log(`총원: ${studentFiles.length}, PASS: ${pass}, FAIL/ERROR: ${failOrError}`);
  console.log(`결과 파일: ${RESULTS_CSV}`);
}

main();
