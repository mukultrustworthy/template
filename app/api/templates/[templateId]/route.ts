import { NextResponse } from "next/server";
import { getTemplateById, updateTemplate, deleteTemplate } from "../../services/templateService";

export async function GET(
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

    const template = await getTemplateById(templateId);

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Error fetching template:", error);
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    );
  }
}

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

    // Parse the request body
    const { template } = await request.json();

    if (!template) {
      return NextResponse.json(
        { error: "Template data is required" },
        { status: 400 }
      );
    }

    // Update the template
    const updatedTemplate = await updateTemplate(templateId, template);

    return NextResponse.json({ 
      template: updatedTemplate,
      message: "Template updated successfully" 
    });
  } catch (error) {
    console.error("Error updating template:", error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Delete the template
    await deleteTemplate(templateId);

    return NextResponse.json({ 
      success: true,
      message: "Template deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
