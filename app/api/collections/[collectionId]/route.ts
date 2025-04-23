import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Collection } from "@/models";
import { Types } from "mongoose";

interface RouteParams {
  params: {
    collectionId: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { collectionId } = params;

    if (!Types.ObjectId.isValid(collectionId)) {
      return NextResponse.json(
        { error: "Invalid collection ID" },
        { status: 400 }
      );
    }

    await dbConnect();
    const collection = await Collection.findById(collectionId)
      .populate("templateIds")
      .lean();

    if (!collection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ collection });
  } catch (error) {
    console.error("Error fetching collection:", error);
    return NextResponse.json(
      { error: "Failed to fetch collection" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { collectionId } = params;
    const body = await request.json();
    const { name, templateIds } = body;

    if (!Types.ObjectId.isValid(collectionId)) {
      return NextResponse.json(
        { error: "Invalid collection ID" },
        { status: 400 }
      );
    }

    // Convert template IDs to ObjectIds
    const validTemplateIds = templateIds
      .filter((id: string) => Types.ObjectId.isValid(id))
      .map((id: string) => new Types.ObjectId(id));

    await dbConnect();
    const collection = await Collection.findByIdAndUpdate(
      collectionId,
      { name, templateIds: validTemplateIds },
      { new: true }
    ).populate("templateIds");

    if (!collection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ collection });
  } catch (error) {
    console.error("Error updating collection:", error);
    return NextResponse.json(
      { error: "Failed to update collection" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { collectionId } = params;

    if (!Types.ObjectId.isValid(collectionId)) {
      return NextResponse.json(
        { error: "Invalid collection ID" },
        { status: 400 }
      );
    }

    await dbConnect();
    const collection = await Collection.findByIdAndDelete(collectionId);

    if (!collection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Collection deleted successfully" });
  } catch (error) {
    console.error("Error deleting collection:", error);
    return NextResponse.json(
      { error: "Failed to delete collection" },
      { status: 500 }
    );
  }
}
