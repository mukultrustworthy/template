"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, FolderPlus } from "lucide-react";
import { toast } from "sonner";
import { TemplateRecord } from "@/app/api/services/templateService";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";

interface Collection {
  _id: string;
  name: string;
  templateIds: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export default function CollectionPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [newCollectionName, setNewCollectionName] = useState("");
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch collections and templates
  useEffect(() => {
    fetchCollections();
    fetchTemplates();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/collections");
      const data = await response.json();
      if (data.collections) {
        setCollections(data.collections);
      }
    } catch (error) {
      console.error("Failed to fetch collections:", error);
      toast.error("Failed to load collections");
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

  const createCollection = async () => {
    if (!newCollectionName.trim()) {
      toast.error("Please enter a collection name");
      return;
    }

    try {
      const response = await fetch("/api/collections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newCollectionName,
          templateIds: selectedTemplates,
        }),
      });

      if (response.ok) {
        toast.success("Collection created successfully");
        setNewCollectionName("");
        setSelectedTemplates([]);
        fetchCollections();
      } else {
        toast.error("Failed to create collection");
      }
    } catch (error) {
      console.error("Error creating collection:", error);
      toast.error("Failed to create collection");
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

  const filteredCollections = collections.filter((collection) =>
    collection.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Collections</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <FolderPlus className="mr-2 h-4 w-4" />
              New Collection
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Collection</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Collection Name</Label>
                <Input
                  id="name"
                  placeholder="Enter collection name"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-2">
                  <Label>Select Templates</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="selectAll"
                      checked={selectedTemplates.length === templates.length}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="text-sm">Select All</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {templates.map((template) => (
                    <div
                      key={template._id}
                      className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50"
                    >
                      <Checkbox
                        id={template._id}
                        checked={selectedTemplates.includes(template._id)}
                        onCheckedChange={(checked) => {
                          const newSelected = checked
                            ? [...selectedTemplates, template._id]
                            : selectedTemplates.filter(
                                (id) => id !== template._id
                              );
                          setSelectedTemplates(newSelected);
                        }}
                      />
                      <Label
                        htmlFor={template._id}
                        className="text-sm font-normal"
                      >
                        {template.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={createCollection}>Create Collection</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2 mb-6">
        <Search className="w-5 h-5 text-gray-400" />
        <Input
          placeholder="Search collections..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p>Loading collections...</p>
        ) : filteredCollections.length === 0 ? (
          <p>No collections found.</p>
        ) : (
          filteredCollections.map((collection) => (
            <Card key={collection._id}>
              <CardHeader>
                <CardTitle>{collection.name}</CardTitle>
                <CardDescription>
                  {collection.templateIds.length} templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {collection.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <Separator className="my-4" />
                <div className="text-sm text-gray-500">
                  Created: {new Date(collection.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
              <CardFooter>
                <Link href={`/dashboard/collections/${collection._id}`}>
                  <Button variant="outline" className="w-full">
                    View Collection
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
