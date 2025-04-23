"use client";

import { useState } from "react";
import { Toaster, toast } from "sonner";
import { Button } from "@/components/ui/button";
import HtmlEditor from "@/components/HtmlEditor";
import JsonEditor from "@/components/JsonEditor";
import TemplatePreview from "@/components/TemplatePreview";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_HTML,
  DEFAULT_JSON,
} from "@/components/templates/default-testimonial";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { TEMPLATE_TYPES } from "@/lib/constants";
// Define form schema with Zod
const formSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  type: z.string().min(1, "Template type is required"),
  tags: z.array(z.string()),
  html: z.string(),
  jsonData: z.record(z.unknown()),
});

export default function Editor() {
  const [isPublishing, setIsPublishing] = useState(false);
  const [customTagInput, setCustomTagInput] = useState<string>("");
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);

  // Initialize form with react-hook-form and zod validation
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "New Template",
      type: "testimonial",
      tags: [],
      html: DEFAULT_HTML,
      jsonData: DEFAULT_JSON,
    },
  });

  // Get current values from form
  const { tags, html, jsonData } = form.watch();

  const handleAddTag = () => {
    if (customTagInput.trim()) {
      const updatedTags = [...tags, customTagInput.trim()];
      form.setValue("tags", updatedTags, { shouldValidate: true });
      setCustomTagInput("");
      setIsTagDialogOpen(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = tags.filter((tag) => tag !== tagToRemove);
    form.setValue("tags", updatedTags, { shouldValidate: true });
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsPublishing(true);

    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          template: {
            htmlRef: values.html,
            type: values.type,
            tags: values.tags,
            name: values.name,
            jsonData: values.jsonData,
            version: 1,
            isLatest: true,
            parentId: null,
            childIds: [],
            publishedAt: null,
            placeholders: [],
            collectionId: null,
          },
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Template published to library successfully!");
      } else {
        toast.error(`Failed to publish: ${result.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error publishing template:", error);
      toast.error("Failed to publish template");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <main className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Template Editor</h1>
        <div className="flex gap-2">
          <Button
            onClick={form.handleSubmit(onSubmit)}
            size="lg"
            disabled={isPublishing}
          >
            {isPublishing ? "Publishing..." : "Publish"}
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-5 p-6 border border-gray-200 rounded-md bg-gray-50">
                <h2 className="text-lg font-semibold">Template Metadata</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter template name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a template type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="w-full">
                            {TEMPLATE_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="tags"
                  render={() => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <div>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {tags.map((tag, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-1 px-2 py-1 bg-gray-200 rounded-md"
                              >
                                <span>{tag}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTag(tag)}
                                  className="text-gray-500 hover:text-gray-700"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>

                          <Dialog
                            open={isTagDialogOpen}
                            onOpenChange={setIsTagDialogOpen}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start"
                                type="button"
                              >
                                Add Tag
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add a new tag</DialogTitle>
                              </DialogHeader>
                              <div className="py-4">
                                <Input
                                  value={customTagInput}
                                  onChange={(e) =>
                                    setCustomTagInput(e.target.value)
                                  }
                                  placeholder="Enter tag name"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleAddTag();
                                    }
                                  }}
                                />
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => setIsTagDialogOpen(false)}
                                  type="button"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={handleAddTag}
                                  disabled={!customTagInput.trim()}
                                  type="button"
                                >
                                  Add
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="html"
                render={() => (
                  <FormItem className="space-y-0">
                    <HtmlEditor
                      html={html}
                      onChange={(value) =>
                        form.setValue("html", value, { shouldValidate: true })
                      }
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jsonData"
                render={() => (
                  <FormItem className="space-y-0">
                    <JsonEditor
                      json={jsonData}
                      onChange={(value) =>
                        form.setValue("jsonData", value, {
                          shouldValidate: true,
                        })
                      }
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="lg:col-span-5">
              <div className="sticky top-6">
                <TemplatePreview html={html} data={jsonData} />
              </div>
            </div>
          </div>
        </form>
      </Form>
      <Toaster richColors position="top-right" />
    </main>
  );
}
