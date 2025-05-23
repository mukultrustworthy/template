import { NextResponse } from "next/server";
import { getTemplatesByType } from "../../../services/templateService";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;
    const url = new URL(request.url);
    
    // Default to production=true unless explicitly set to false
    const production = url.searchParams.get('production');
    const productionOnly = production !== 'false';

    if (!type) {
      return NextResponse.json(
        { error: "Template type is required" },
        { status: 400 }
      );
    }

    const templates = await getTemplatesByType(type, productionOnly);

    return NextResponse.json({ 
      templates,
      metadata: {
        type,
        productionOnly,
        count: templates.length
      }
    });
  } catch (error) {
    console.error("Error fetching templates by type:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}
