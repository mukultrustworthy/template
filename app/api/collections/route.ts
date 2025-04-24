import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Collection } from "@/models";

export async function GET() {
  try {
    await dbConnect();
    const collections = await Collection.find().populate("templateIds").lean();

    return NextResponse.json({ collections });
  } catch (error) {
    console.error("Error fetching collections:", error);
    return NextResponse.json(
      { error: "Failed to fetch collections" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, templateIds } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Collection name is required" },
        { status: 400 }
      );
    }

    await dbConnect();
    const collection = await Collection.create({
      name,
      templateIds,
    });

    return NextResponse.json({ collection }, { status: 201 });
  } catch (error) {
    console.error("Error creating collection:", error);
    return NextResponse.json(
      { error: "Failed to create collection" },
      { status: 500 }
    );
  }
}
