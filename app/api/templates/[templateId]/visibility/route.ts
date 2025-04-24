import { NextResponse } from "next/server";
import { getTemplateById, updateTemplate } from "../../../services/templateService";

// PATCH endpoint to toggle visibility
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await params;

    if (!templateId) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      );
    }

    // Get the current template to verify it exists
    const existingTemplate = await getTemplateById(templateId);

    if (!existingTemplate) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Parse the request body to get the visibility value
    const { isVisible } = await request.json();
    
    if (isVisible === undefined) {
      return NextResponse.json(
        { error: "isVisible field is required" },
        { status: 400 }
      );
    }

    console.log(`Toggling template visibility to: ${isVisible}`);

    // Update only the visibility field
    const updatedTemplate = await updateTemplate(templateId, { isVisible });

    return NextResponse.json({ 
      template: updatedTemplate,
      message: `Template ${isVisible ? 'shown' : 'hidden'} successfully` 
    });
  } catch (error) {
    console.error("Error updating template visibility:", error);
    return NextResponse.json(
      { error: "Failed to update template visibility" },
      { status: 500 }
    );
  }
} 