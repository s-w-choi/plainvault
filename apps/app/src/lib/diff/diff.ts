export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumber?: number;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface DiffResult {
  lines: DiffLine[];
  hasChanges: boolean;
}

export function computeLineDiff(oldContent: string, newContent: string): DiffResult {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');

  const diff: DiffLine[] = [];
  let hasChanges = false;

  const lcs = longestCommonSubsequence(oldLines, newLines);

  let oldIndex = 0;
  let newIndex = 0;
  let lcsIndex = 0;
  let oldLineNum = 1;
  let newLineNum = 1;

  while (oldIndex < oldLines.length || newIndex < newLines.length) {
    if (lcsIndex < lcs.length && oldIndex < oldLines.length && newIndex < newLines.length &&
        oldLines[oldIndex] === lcs[lcsIndex] && newLines[newIndex] === lcs[lcsIndex]) {
      diff.push({
        type: 'unchanged',
        content: oldLines[oldIndex],
        oldLineNumber: oldLineNum,
        newLineNumber: newLineNum,
      });
      oldIndex++;
      newIndex++;
      lcsIndex++;
      oldLineNum++;
      newLineNum++;
    } else if (oldIndex < oldLines.length &&
               (lcsIndex >= lcs.length || oldLines[oldIndex] !== lcs[lcsIndex])) {
      diff.push({
        type: 'removed',
        content: oldLines[oldIndex],
        oldLineNumber: oldLineNum,
      });
      oldIndex++;
      oldLineNum++;
      hasChanges = true;
    } else if (newIndex < newLines.length &&
               (lcsIndex >= lcs.length || newLines[newIndex] !== lcs[lcsIndex])) {
      diff.push({
        type: 'added',
        content: newLines[newIndex],
        newLineNumber: newLineNum,
      });
      newIndex++;
      newLineNum++;
      hasChanges = true;
    }
  }

  return { lines: diff, hasChanges };
}

function longestCommonSubsequence(a: string[], b: string[]): string[] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const lcs: string[] = [];
  let i = m;
  let j = n;

  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      lcs.unshift(a[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return lcs;
}
