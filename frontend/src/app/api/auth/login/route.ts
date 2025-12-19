import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 1. Forward the request to your FastAPI container/service
    const backendRes = await fetch(`${process.env.INTERNAL_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(
        { detail: data.detail || "Authentication Failed" }, 
        { status: backendRes.status }
      );
    }

    // 2. Capture the 'Set-Cookie' header from FastAPI
    const cookieHeader = backendRes.headers.get('set-cookie');
    
    // 3. Create a response for the browser
    const response = NextResponse.json({ 
      success: true, 
      user: data.user 
    });

    // 4. Mirror the cookie to the browser
    if (cookieHeader) {
      response.headers.set('set-cookie', cookieHeader);
    }

    return response;

  } catch (error) {
    return NextResponse.json({ detail: "BFF Uplink Failure" }, { status: 500 });
  }
}