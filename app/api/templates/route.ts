import { NextResponse } from "next/server";
import { createTemplate, getAllTemplates } from "../services/templateService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { template } = body;

    if (!template) {
      return NextResponse.json(
        { error: "Missing required fields: template" },
        { status: 400 }
      );
    }

    const result = await createTemplate(template);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error publishing template:", error);
    return NextResponse.json(
      { error: "Failed to publish template" },
      { status: 500 }
    );
  }
}

// GET endpoint to list all templates
export async function GET() {
  try {
    const templates = await getAllTemplates();
    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}
