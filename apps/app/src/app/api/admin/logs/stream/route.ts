import type { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/auth-handler';
import { getBufferedLogs, type LogEntry, logStream } from '@/lib/logging/log-stream';

const encoder = new TextEncoder();
const KEEPALIVE_INTERVAL_MS = 30_000;

const encodeSseEntry = (entry: LogEntry) => encoder.encode(`data: ${JSON.stringify(entry)}\n\n`);
const encodeKeepalive = () => encoder.encode(': ping\n\n');

export async function GET(request: NextRequest) {
  const auth = await withAuth(request, ['ADMIN']);
  if ('response' in auth) return auth.response;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;

      const enqueue = (chunk: Uint8Array) => {
        if (!closed) {
          controller.enqueue(chunk);
        }
      };

      for (const entry of getBufferedLogs()) {
        enqueue(encodeSseEntry(entry));
      }

      const unsubscribe = logStream.subscribe((entry) => {
        enqueue(encodeSseEntry(entry));
      });

      const keepalive = setInterval(() => {
        enqueue(encodeKeepalive());
      }, KEEPALIVE_INTERVAL_MS);

      const cleanup = () => {
        if (closed) {
          return;
        }

        closed = true;
        clearInterval(keepalive);
        unsubscribe();
        controller.close();
      };

      request.signal.addEventListener('abort', cleanup, { once: true });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
