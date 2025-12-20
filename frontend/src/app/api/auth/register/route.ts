import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const backendUrl = `${process.env.INTERNAL_API_URL}/api/auth/register`;

    const backendRes = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(data, { status: backendRes.status });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({ detail: "BFF Registry Uplink Failure" }, { status: 500 });
  }
}