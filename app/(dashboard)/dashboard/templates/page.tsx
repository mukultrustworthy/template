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
import { Search } from "lucide-react";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { TemplateRecord } from "@/app/api/services/templateService";
import { Separator } from "@/components/ui/separator";
import { CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function Templates() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [templatePreviews, setTemplatePreviews] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    async function fetchTemplates() {
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

          const previews: Record<string, string> = {};
          for (const template of data.templates) {
            previews[template.id] = await generatePreviewHtml(template);
          }
          setTemplatePreviews(previews);
        }
      } catch (error) {
        console.error("Failed to fetch templates:", error);
        toast.error("Failed to load asset templates");
      } finally {
        setLoading(false);
      }
    }

    fetchTemplates();
  }, []);

  const generatePlaceholderHtml = (template: TemplateRecord): string => {
    return `<!DOCTYPE html>
<html>
<head>
  <title>${template.type} Template</title>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      margin: 10px;
      font-size: 14px;
      line-height: 1.5;
    }
    [data-placeholder] {
      background-color: rgba(59, 130, 246, 0.1);
      border: 1px dashed #3b82f6;
      padding: 2px 4px;
      border-radius: 2px;
      color: #2563eb;
      font-weight: 500;
    }
    .template-heading {
      font-size: 16px;
      margin-bottom: 10px;
    }
    .field-item {
      margin-bottom: 8px;
    }
  </style>
</head>
<body>
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
  </div>
</body>
</html>`;
  };

  const generatePreviewHtml = async (
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

      // If we have HTML content and placeholders, apply them
      if (htmlContent && template.placeholders) {
        // Process placeholders similar to TemplatePreview component
        let processedHtml = htmlContent;

        function processObject(obj: Record<string, unknown>, prefix = "") {
          Object.entries(obj).forEach(([key, value]) => {
            const currentPath = prefix ? `${prefix}.${key}` : key;

            if (value !== null && typeof value === "object") {
              // Recursively process nested objects
              processObject(value as Record<string, unknown>, currentPath);
            } else {
              // Replace placeholders in the format {{key}} with their values
              const placeholder = `{{${currentPath}}}`;
              const regex = new RegExp(placeholder, "g");
              processedHtml = processedHtml.replace(regex, String(value));
            }
          });
        }

        processObject(template.jsonData || {});

        // Wrap in a proper HTML document with styles
        return `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { margin: 0; font-family: sans-serif; }
                * { box-sizing: border-box; }
              </style>
            </head>
            <body class="prose prose-sm max-w-none">
              ${processedHtml}
            </body>
          </html>
        `;
      }

      return htmlContent || generatePlaceholderHtml(template);
    } catch (error) {
      console.error("Error generating preview HTML:", error);
      return `<html><body><p>Preview not available</p></body></html>`;
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
            <Card
              key={template.name}
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

              <div className="px-6">
                <div className="border rounded-md overflow-hidden">
                  <div className="relative">
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
                    <iframe
                      srcDoc={templatePreviews[template.id] || ""}
                      className="aspect-square w-full border-none bg-white"
                      title={`${template.type} Template Preview`}
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
                <Button size="sm" className="flex-1">
                  Edit
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
