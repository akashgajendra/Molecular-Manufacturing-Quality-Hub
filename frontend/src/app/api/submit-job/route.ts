import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('helix_token')?.value;

    const data = await request.formData();
    const method = data.get("method") as string;
    const sequenceEntry = data.get("sequenceEntry") as string;
    const file = data.get("file") as File;
    console.log("Received data:", { method, sequenceEntry, file });
    let targetUrl = "";
    const backendFormData = new FormData();

    switch (method) {
      case "peptide":
        targetUrl = `${process.env.BACKEND_URL}/api/submit/peptide`;
        backendFormData.append("sequence", sequenceEntry);
        backendFormData.append("mzml_file", file);
        break;

      case "colony":
        targetUrl = `${process.env.BACKEND_URL}/api/submit/colony`;
        // Hardcoding backend defaults as per backend source of trust
        backendFormData.append("min_diameter_mm", "0.5"); 
        backendFormData.append("colony_image", file);
        break;

      case "crispr":
        targetUrl = `${process.env.BACKEND_URL}/api/submit/crispr`;
        backendFormData.append("guide_rna_sequence", sequenceEntry);
        break;
        
      default:
        return NextResponse.json({ detail: "Invalid method" }, { status: 400 });
    }

    const res = await fetch(targetUrl, {
      method: 'POST',
      body: backendFormData,
      headers: {
        'Cookie': `helix_token=${token}`
      },
    });

    const result = await res.json();
    return NextResponse.json(result, { status: res.status });

  } catch (error) {
    console.error("BFF_DISPATCH_ERROR:", error);
    return NextResponse.json({ detail: "Internal Uplink Failure" }, { status: 500 });
  }
}