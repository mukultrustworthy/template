"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Trash2, Download } from "lucide-react";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { TemplateRecord } from "@/app/api/services/templateService";
import { Separator } from "@/components/ui/separator";
import { CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast, Toaster } from "sonner";
import TemplatePreview from "@/components/TemplatePreview";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TemplateCardProps {
  template: TemplateRecord;
  templateHtmlContent: Record<string, string>;
  onDelete: (templateId: string) => void;
}

const TemplateCard = ({ template, templateHtmlContent, onDelete }: TemplateCardProps) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadImage = async () => {
    try {
      setIsDownloading(true);
      
      // Prepare HTML with template data
      const htmlTemplate = templateHtmlContent[template._id] || "";
      const templateData = template.jsonData || {};
      
      // Process the HTML to replace placeholders with actual data
      let processedHtml = htmlTemplate;
      
      // Look for elements with data-placeholder attributes and replace their content
      Object.entries(templateData).forEach(([key, value]) => {
        // Use regex to find data-placeholder attributes with this key
        const pattern = new RegExp(`data-placeholder=["']${key}["'][^>]*>([^<]*)`, 'g');
        processedHtml = processedHtml.replace(pattern, `data-placeholder="${key}">${value}`);
        
        // Also replace simple {{placeholders}}
        processedHtml = processedHtml.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      });
      
      // Call the API endpoint to convert HTML to JPEG
      const response = await fetch('/api/render/jpeg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html: processedHtml
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate image');
      }
      
      // Get the image blob
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.name || 'template'}.jpg`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Image downloaded successfully');
    } catch (error) {
      console.error('Error downloading image:', error);
      toast.error('Failed to download image');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card
      key={template._id}
      className="flex flex-col overflow-hidden hover:shadow-md transition-shadow"
    >
      <CardHeader className="">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg line-clamp-1">
              {template.name}
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {template.type}
            </Badge>
          </div>
          <Badge variant={template.isLatest ? "default" : "outline"}>
            v{template.version}
          </Badge>
        </div>
      </CardHeader>

      <div className="px-0">
        <div className="border rounded-md overflow-hidden">
          <div className="relative w-full h-[300px] m-0 p-0">
            <div className="absolute top-2 right-2 z-10">
              {/* <Button
                size="icon"
                variant="secondary"
                className="h-6 w-6"
                onClick={() => openFullscreenPreview(template)}
              >
                <Maximize size={14} />
              </Button> */}
            </div>
            <TemplatePreview
              html={templateHtmlContent[template._id] || ""}
              data={template.jsonData || {}}
            />
          </div>
        </div>
      </div>

      <CardContent className="flex-1">
        <div className="flex flex-wrap gap-1">
          {template.tags?.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {template.tags?.length === 0 && (
            <span className="text-xs text-muted-foreground italic">
              No tags
            </span>
          )}
        </div>

        <Separator className="my-3" />

        <div className="text-xs text-muted-foreground">
          <p>
            <strong>Fields: </strong>
            {Object.keys(template.jsonData || {}).length}
          </p>
          <p>
            <strong>Created by: </strong>
            {template.createdBy}
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 pt-0">
        <Link href={`/dashboard/templates/edit?id=${template._id}`} className="flex-1">
          <Button size="sm" className="w-full">
            Edit
          </Button>
        </Link>
        <Button 
          variant="secondary" 
          size="sm" 
          className="px-3"
          onClick={handleDownloadImage}
          disabled={isDownloading}
        >
          <Download size={16} />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="px-3">
              <Trash2 size={16} />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Template</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the template &quot;{template.name}&quot;? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(template._id)}
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
};

export default function Templates() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [templateHtmlContent, setTemplateHtmlContent] = useState<
    Record<string, string>
  >({});

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/templates");
      const data = await response.json();

      if (data.templates) {
        setTemplates(data.templates);

        const tags = new Set<string>();
        data.templates.forEach((template: TemplateRecord) => {
          template.tags?.forEach((tag) => tags.add(tag));
        });
        setAllTags(Array.from(tags));

        const htmlContents: Record<string, string> = {};
        for (const template of data.templates) {
          htmlContents[template._id] = await fetchTemplateHtml(template);
        }
        setTemplateHtmlContent(htmlContents);
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
      toast.error("Failed to load asset templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const generatePlaceholderHtml = (template: TemplateRecord): string => {
    return `
    <div class="template-container">
      <div class="template-heading">Template Preview</div>
      ${Object.keys(template.jsonData || {})
        .map((fieldPath) => {
          const value = template.jsonData?.[fieldPath];
          return `<div class="field-item">
        <strong>${fieldPath}:</strong>
        <span data-placeholder="${fieldPath}">${
            value || `{{${fieldPath}}}`
          }</span>
      </div>`;
        })
        .join("\n    ")}
    </div>`;
  };

  const fetchTemplateHtml = async (
    template: TemplateRecord
  ): Promise<string> => {
    try {
      let htmlContent = "";

      try {
        const response = await fetch(template.htmlUrl);
        if (response.ok) {
          htmlContent = await response.text();
        }
      } catch (fetchError) {
        console.warn(
          "Using placeholder HTML since real content could not be fetched",
          fetchError
        );
        htmlContent = generatePlaceholderHtml(template);
        return htmlContent;
      }

      return htmlContent || generatePlaceholderHtml(template);
    } catch (error) {
      console.error("Error fetching template HTML:", error);
      return `<p>Preview not available</p>`;
    }
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      searchTerm === "" ||
      template.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.createdBy?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTag = filterTag === "" || template.tags?.includes(filterTag);

    return matchesSearch && matchesTag;
  });

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Template deleted successfully");
        // Refresh templates
        fetchTemplates();
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete template");
      }
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error(`Failed to delete template: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  return (
    <div>
      <Card className="mb-8">
        <CardHeader className="flex flex-row justify-between">
          <div>
            <CardTitle>Search Templates</CardTitle>
            <CardDescription>
              Find templates by ID, type, or creator
            </CardDescription>
          </div>
          <Link href="/dashboard/templates/editor">
            <Button size="lg" className="cursor-pointer">
              Create New Template
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">
                Search
              </Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by asset ID, type or creator..."
                  className="pl-8 h-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="w-full md:w-64">
              <Label htmlFor="tag-filter" className="sr-only">
                Filter by Tag
              </Label>
              <select
                id="tag-filter"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
              >
                <option value="">All tags</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading templates...</p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12 bg-muted/20 rounded-lg">
          <p className="text-xl font-medium">No Templates found</p>
          <p className="text-muted-foreground text-sm mb-4">
            {searchTerm || filterTag
              ? "Try adjusting your search filters"
              : "Create your first template to get started"}
          </p>
          <Link href="/dashboard/templates/editor">
            <Button size="lg" className="cursor-pointer">
              Create New Template
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredTemplates.map((template) => (
            <TemplateCard 
              key={template._id}
              template={template}
              templateHtmlContent={templateHtmlContent}
              onDelete={handleDeleteTemplate}
            />
          ))}
        </div>
      )}
      <Toaster richColors position="top-right" />
    </div>
  );
}
