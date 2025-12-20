import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('helix_token')?.value;

    const res = await fetch(`${process.env.BACKEND_URL}/api/jobs`, {
      headers: { 'Cookie': `helix_token=${token}` },
    });

    if (!res.ok) return NextResponse.json([], { status: res.status });
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ detail: "Failed to fetch jobs" }, { status: 500 });
  }
}