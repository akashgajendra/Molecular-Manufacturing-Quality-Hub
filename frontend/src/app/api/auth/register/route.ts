import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("BFF RECEIVED DATA:", body); // Debug log 1

    const backendUrl = `${process.env.INTERNAL_API_URL}/api/auth/register`;
    console.log("FORWARDING TO:", backendUrl); // Debug log 2

    const backendRes = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    console.log("FASTAPI RESPONSE", backendRes);
    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(data, { status: backendRes.status });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("CRITICAL BFF ERROR:", error);
    return NextResponse.json({ detail: "BFF Registry Uplink Failure" }, { status: 500 });
  }
}
// import { NextResponse } from 'next/server';

// export async function POST(request: Request) {
//   try {
//     const body = await request.json();
    
//     // 1. Forward the request to your FastAPI container/service
//     const backendRes = await fetch(`${process.env.INTERNAL_API_URL}/api/auth/register`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(body),
//     });

//     const data = await backendRes.json();
//     if (!backendRes.ok) {
//       return NextResponse.json(
//         { detail: data.detail || "Registration Failed" }, 
//         { status: backendRes.status }
//       );
//     }

//     // 2. Capture the 'Set-Cookie' header from FastAPI
//     // const cookieHeader = backendRes.headers.get('set-cookie');
    
//     // // 3. Create a response for the browser
//     const response = NextResponse.json({ 
//       success: true,
//       user: data.user
//     });

//     // // 4. Mirror the 'Set-Cookie' header to the browser
//     // if (cookieHeader) {
//     //   response.headers.set('set-cookie', cookieHeader);
//     // }

//     return response;

//   } catch (error) {
//     return NextResponse.json({ detail: "BFF Uplink Failure" }, { status: 500 });
//   }
// }