const FORBIDDEN_CHARS = /[\x00]/;
const PATH_TRAVERSAL = /(\.\.[/\\])|([/\\]\.\.)|(^\/)|(^[A-Za-z]:)/;
const MAX_TITLE_LENGTH = 255;
const MAX_FILENAME_LENGTH = 255;
const MAX_SUMMARY_LENGTH = 500;
const MAX_CONTENT_SIZE = parseInt(process.env.MAX_FILE_CONTENT_BYTES || '1048576', 10);

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateTitle(title: string): ValidationResult {
  const errors: string[] = [];

  if (!title || title.trim().length === 0) {
    errors.push('Title is required');
  }

  if (title.length > MAX_TITLE_LENGTH) {
    errors.push(`Title must be ${MAX_TITLE_LENGTH} characters or less`);
  }

  return { valid: errors.length === 0, errors };
}

export function validateActualFileName(fileName: string): ValidationResult {
  const errors: string[] = [];

  if (!fileName || fileName.trim().length === 0) {
    errors.push('File name is required');
  }

  if (fileName.length > MAX_FILENAME_LENGTH) {
    errors.push(`File name must be ${MAX_FILENAME_LENGTH} characters or less`);
  }

  if (FORBIDDEN_CHARS.test(fileName)) {
    errors.push('File name contains forbidden characters');
  }

  if (PATH_TRAVERSAL.test(fileName)) {
    errors.push('File name contains path traversal patterns');
  }

  return { valid: errors.length === 0, errors };
}

export function validateChangeSummary(summary: string): ValidationResult {
  const errors: string[] = [];

  if (!summary || summary.trim().length === 0) {
    errors.push('Change summary is required');
  }

  if (summary.length > MAX_SUMMARY_LENGTH) {
    errors.push(`Change summary must be ${MAX_SUMMARY_LENGTH} characters or less`);
  }

  return { valid: errors.length === 0, errors };
}

export function validateContentSize(content: string): ValidationResult {
  const errors: string[] = [];

  if (Buffer.byteLength(content, 'utf8') > MAX_CONTENT_SIZE) {
    errors.push(`Content size exceeds maximum of ${MAX_CONTENT_SIZE} bytes`);
  }

  return { valid: errors.length === 0, errors };
}

export function validateContentType(contentType: string): ValidationResult {
  const validTypes = ['env', 'markdown', 'text'];
  const errors: string[] = [];

  if (!contentType || !validTypes.some((t) => contentType.startsWith(t))) {
    errors.push(`Content type must be one of: ${validTypes.join(', ')}`);
  }

  return { valid: errors.length === 0, errors };
}
