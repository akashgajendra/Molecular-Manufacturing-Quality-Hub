import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 1. Call FastAPI
    const backendRes = await fetch(`${process.env.BACKEND_URL}/api/auth/login`, {
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

    // 2. Setup the Response
    const response = NextResponse.json({ 
      success: true, 
      user: data.user 
    });

    // 3. Extract the token value from the FastAPI Set-Cookie header
    // FastAPI sends: "helix_token=TOKEN_VALUE; HttpOnly; Max-Age=..."
    const cookieHeader = backendRes.headers.get('set-cookie');
    
    if (cookieHeader) {
        // Logic to extract just the token value
        const tokenValue = cookieHeader.split(';')[0].split('=')[1];
        
        // 4. Set the cookie using the Next.js helper (much safer)
        const cookieStore = await cookies();
        cookieStore.set('helix_token', tokenValue, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 // 24 hours (match your backend)
        });
    }

    return response;

  } catch (error) {
    console.error("LOGIN_ERROR:", error);
    return NextResponse.json({ detail: "BFF Uplink Failure" }, { status: 500 });
  }
}