const MASK = '********';

const SECRET_PATTERNS = [
  /((?:api[_-]?key|token|secret|password|pass|credential)([=:\s]+))[a-zA-Z0-9_\-=\/+]{8,}/gi,
  /((?:bearer|token)([=:\s]+))[a-zA-Z0-9_\-]+/gi,
  /https?:\/\/[^:]+:[^@]+@/gi,
];

export function maskContent(content: string, contentType: string): string {
  if (contentType.startsWith('env')) {
    return maskEnvContent(content);
  }

  if (contentType.startsWith('yaml')) {
    return maskYamlContent(content);
  }

  if (contentType.startsWith('xml')) {
    return maskXmlContent(content);
  }

  if (contentType.startsWith('json')) {
    return maskJsonContent(content);
  }

  return maskGeneralContent(content);
}

function maskEnvContent(content: string): string {
  return content
    .split('\n')
    .map((line) => {
      if (/^\s*#/.test(line)) {
        return line;
      }

      return line.replace(/^(\s*(?:export\s+)?[^=:#\s][^=:]*\s*[=:]\s*)(.*)$/, `$1${MASK}`);
    })
    .join('\n');
}

function maskYamlContent(content: string): string {
  return content
    .split('\n')
    .map((line) => {
      if (/^\s*#/.test(line)) {
        return line;
      }

      const match = line.match(/^(\s*(?:-\s+)?[^#\n][^:\n]*:\s+)([^#\n]+?)(\s+#.*)?$/);
      if (!match) {
        return line;
      }

      const [, prefix, , comment = ''] = match;
      return `${prefix}${MASK}${comment}`;
    })
    .join('\n');
}

function maskXmlContent(content: string): string {
  let masked = content.replace(/=(["'])(.*?)\1/g, `=$1${MASK}$1`);

  masked = masked.replace(/>([^<]+)</g, (_match, value: string) => {
    return value.trim().length === 0 ? `>${value}<` : `>${MASK}<`;
  });

  return masked;
}

function maskJsonContent(content: string): string {
  try {
    const parsed = JSON.parse(content);
    return JSON.stringify(maskJsonValue(parsed), null, 2);
  } catch {
    return maskGeneralContent(content);
  }
}

function maskJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => maskJsonValue(item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, maskJsonValue(nestedValue)])
    );
  }

  if (value === null) {
    return null;
  }

  return MASK;
}

function maskGeneralContent(content: string): string {
  let masked = content;

  for (const pattern of SECRET_PATTERNS) {
    masked = masked.replace(pattern, '$1********');
  }

  return masked;
}
