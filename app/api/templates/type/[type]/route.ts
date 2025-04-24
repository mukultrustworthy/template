import { NextResponse } from "next/server";
import { getTemplatesByType } from "../../../services/templateService";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;

    if (!type) {
      return NextResponse.json(
        { error: "Template type is required" },
        { status: 400 }
      );
    }

    const templates = await getTemplatesByType(type);

    console.log(templates);

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Error fetching templates by type:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}
