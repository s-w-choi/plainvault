const SECRET_PATTERNS = [
  /^(API_KEY|TOKEN|SECRET|PASSWORD|PASS|DATABASE_URL|PRIVATE_KEY|ACCESS_KEY|REFRESH_TOKEN|CLIENT_SECRET|WEBHOOK_SECRET|AWS_|AZURE_|GCP_|STRIPE_|SENDGRID_|MAILGUN_|TWILIO_)[=:].*$/im,
  /^(openai|anthropic|google|github|gitlab|slack|jira|datadog|newrelic|sentry)[_-]?(api|key|token|secret)[=:]?.*$/im,
  /^(bearer|token|api[_-]?key)[=:].*$/im,
  /postgres(ql)?:\/\/[^@]+@/im,
  /mongodb(\+srv)?:\/\/[^@]+@/im,
  /redis:\/\/[^@]+@/im,
  /["']?[a-z_][a-z0-9_]*(key|token|secret|password|pass|url|uri)[=:\s]+[a-zA-Z0-9_\-=\/+]{8,}/im,
];

export function maskContent(content: string, contentType: string): string {
  if (contentType === 'env' || contentType === 'text') {
    return maskEnvContent(content);
  }

  return maskGeneralContent(content);
}

function maskEnvContent(content: string): string {
  const lines = content.split('\n');
  return lines
    .map((line) => {
      for (const pattern of SECRET_PATTERNS) {
        if (pattern.test(line)) {
          return line.replace(/([=:])\s*(.*)$/, '$1********');
        }
      }

      if (line.match(/^[A-Z_][A-Z0-9_]*(=|:)/)) {
        return line.replace(/([=:])\s*(.*)$/, '$1********');
      }

      return line;
    })
    .join('\n');
}

function maskGeneralContent(content: string): string {
  let masked = content;

  masked = masked.replace(
    /((?:api[_-]?key|token|secret|password|pass|credential)([=:\s]+))[a-zA-Z0-9_\-=\/+]{8,}/gi,
    '$1********'
  );

  masked = masked.replace(
    /((?:bearer|token)([=:\s]+))[a-zA-Z0-9_\-]+/gi,
    '$1********'
  );

  masked = masked.replace(
    /https?:\/\/[^:]+:[^@]+@/gi,
    'https://********:********@'
  );

  return masked;
}
