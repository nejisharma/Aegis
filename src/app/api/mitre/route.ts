import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { MITREData } from '@/types/mitre';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get('type') as 'groups' | 'techniques' | 'tactics' | 'software' | null;

  if (type && !['groups', 'techniques', 'tactics', 'software'].includes(type)) {
    return NextResponse.json(
      { error: 'type must be one of: groups, techniques, tactics, software' },
      { status: 400 }
    );
  }

  try {
    const filePath = path.join(process.cwd(), 'public/data/mitre-attack.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data: MITREData = JSON.parse(fileContent);

    if (type) {
      return NextResponse.json({ [type]: data[type] }, {
        headers: {
          'Cache-Control': 'public, s-maxage=86400',
        },
      });
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400',
      },
    });
  } catch (err) {
    if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json(
        { error: 'MITRE ATT&CK data file not found. Run the fetch script to download the data, or ensure public/data/mitre-attack.json exists.' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: `Failed to load MITRE data: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
