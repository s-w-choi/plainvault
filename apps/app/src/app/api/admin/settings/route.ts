import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/auth-handler';
import { getAllSettings, updateSettings, SETTING_DEFINITIONS } from '@/lib/settings/settings';

export async function GET(request: NextRequest) {
  const auth = await withAuth(request, ['ADMIN']);
  if ('response' in auth) return auth.response;

  const settings = await getAllSettings();

  return NextResponse.json({
    settings,
    definitions: SETTING_DEFINITIONS,
  });
}

export async function PATCH(request: NextRequest) {
  const auth = await withAuth(request, ['ADMIN']);
  if ('response' in auth) return auth.response;

  const body = await request.json();
  const { settings } = body;

  if (!settings || typeof settings !== 'object') {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'settings object is required' } },
      { status: 400 }
    );
  }

  await updateSettings(settings);

  return NextResponse.json({ message: 'Settings updated' });
}
