import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const method = data.get("method") as string;
    const sequenceEntry = data.get("sequenceEntry") as string;
    const file = data.get("file") as File;

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
    });

    const result = await res.json();
    return NextResponse.json(result, { status: res.status });

  } catch (error) {
    console.error("BFF_DISPATCH_ERROR:", error);
    return NextResponse.json({ detail: "Internal Uplink Failure" }, { status: 500 });
  }
}