const DEFAULT_TIMEZONE = 'Asia/Seoul';
const DEFAULT_LOCALE = 'ko-KR';

export function toTimezone(date: Date, timezone: string = DEFAULT_TIMEZONE): Date {
  const utc = date.getTime();
  const offset = getTimezoneOffsetMs(timezone, date);
  return new Date(utc + offset);
}

function getTimezoneOffsetMs(timezone: string, date: Date): number {
  try {
    const utcFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const tzFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const utcParts = utcFormatter.formatToParts(date);
    const tzParts = tzFormatter.formatToParts(date);

    const extract = (parts: Intl.DateTimeFormatPart[], type: string) =>
      Number(parts.find((p) => p.type === type)?.value ?? 0);

    const utcDate = new Date(
      extract(utcParts, 'year'),
      extract(utcParts, 'month') - 1,
      extract(utcParts, 'day'),
      extract(utcParts, 'hour'),
      extract(utcParts, 'minute'),
      extract(utcParts, 'second')
    );

    const tzDate = new Date(
      extract(tzParts, 'year'),
      extract(tzParts, 'month') - 1,
      extract(tzParts, 'day'),
      extract(tzParts, 'hour'),
      extract(tzParts, 'minute'),
      extract(tzParts, 'second')
    );

    return tzDate.getTime() - utcDate.getTime();
  } catch {
    return 0;
  }
}

export function formatDateTime(
  date: Date,
  options: { timezone?: string; locale?: string } = {}
): string {
  const { timezone = DEFAULT_TIMEZONE, locale = DEFAULT_LOCALE } = options;

  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    const d = toTimezone(date, timezone);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
}

export function formatDateTimeISO(date: Date, timezone?: string): string {
  return formatDateTime(date, { timezone });
}

export function formatKST(date: Date): string {
  const kst = toTimezone(date, 'Asia/Seoul');
  const year = kst.getFullYear();
  const month = String(kst.getMonth() + 1).padStart(2, '0');
  const day = String(kst.getDate()).padStart(2, '0');
  const hours = String(kst.getHours()).padStart(2, '0');
  const minutes = String(kst.getMinutes()).padStart(2, '0');
  const seconds = String(kst.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function formatKSTISO(date: Date): string {
  return formatKST(date);
}
