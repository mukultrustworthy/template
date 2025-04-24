"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { TemplateRecord } from "@/app/api/services/templateService";

interface Collection {
  id: string;
  name: string;
  templateIds: TemplateRecord[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export default function CollectionDetailPage({
  params,
}: {
  params: Promise<{ collectionId: string }>;
}) {
  const router = useRouter();
  const { collectionId } = use(params);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);

  useEffect(() => {
    fetchCollection();
    fetchTemplates();
  }, [collectionId]);

  const fetchCollection = async () => {
    try {
      const response = await fetch(`/api/collections/${collectionId}`);
      const data = await response.json();
      if (data.collection) {
        setCollection(data.collection);
        setEditName(data.collection.name);
        setSelectedTemplates(
          data.collection.templateIds.map(
            (template: TemplateRecord) => template._id
          )
        );
      }
    } catch (error) {
      console.error("Failed to fetch collection:", error);
      toast.error("Failed to load collection");
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/templates");
      const data = await response.json();
      if (data.templates) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
      toast.error("Failed to load templates");
    }
  };

  const handleUpdate = async () => {
    try {
      const response = await fetch(`/api/collections/${collectionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editName,
          templateIds: selectedTemplates,
        }),
      });

      if (response.ok) {
        toast.success("Collection updated successfully");
        setEditMode(false);
        fetchCollection();
      } else {
        toast.error("Failed to update collection");
      }
    } catch (error) {
      console.error("Error updating collection:", error);
      toast.error("Failed to update collection");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this collection?")) {
      return;
    }

    try {
      const response = await fetch(`/api/collections/${collectionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Collection deleted successfully");
        router.push("/dashboard/collections");
      } else {
        toast.error("Failed to delete collection");
      }
    } catch (error) {
      console.error("Error deleting collection:", error);
      toast.error("Failed to delete collection");
    }
  };

  const handleSelectAll = () => {
    if (selectedTemplates.length === templates.length) {
      // If all templates are selected, deselect all
      setSelectedTemplates([]);
    } else {
      // Otherwise, select all templates
      setSelectedTemplates(templates.map((template) => template._id));
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!collection) {
    return <div>Collection not found</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/collections")}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Collections
        </Button>
        <h1 className="text-3xl font-bold flex-1">{collection.name}</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setEditMode(true)}
            className="gap-2"
          >
            <Edit2 className="h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Dialog open={editMode} onOpenChange={setEditMode}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Collection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Collection Name</Label>
              <Input
                id="name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-2">
                <Label>Select Templates</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedTemplates.length === templates.length}
                    onChange={handleSelectAll}
                    className="cursor-pointer"
                  />
                  <span className="text-sm">Select All</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                {templates.map((template) => (
                  <div
                    key={template._id}
                    className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setSelectedTemplates((prev) =>
                        prev.includes(template._id)
                          ? prev.filter((id) => id !== template._id)
                          : [...prev, template._id]
                      );
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTemplates.includes(template._id)}
                      readOnly
                      className="cursor-pointer"
                    />
                    <span className="text-sm">{template.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMode(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collection.templateIds.map((template: TemplateRecord) => (
          <Card key={template._id}>
            <CardHeader>
              <CardTitle>{template.name}</CardTitle>
              <CardDescription>Version {template.version}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {template.tags?.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="text-sm text-gray-500">
                Created by: {template.createdBy}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
