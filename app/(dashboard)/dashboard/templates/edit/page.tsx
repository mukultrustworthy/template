"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Input } from "@/components/ui/input";
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
import { useForm, SubmitHandler, Control } from "react-hook-form";
import * as z from "zod";
import { TEMPLATE_TYPES } from "@/lib/constants";
import { Download, Eye, EyeOff } from "lucide-react";

// Define form schema with Zod
const formSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  type: z.string().min(1, "Template type is required"),
  tags: z.array(z.string()),
  html: z.string(),
  jsonData: z.record(z.unknown()),
  isVisible: z.boolean(),
  production: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

// Create a type-safe control component
type FormControlType = Control<FormValues>;

function EditTemplateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("id");
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [customTagInput, setCustomTagInput] = useState<string>("");
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Initialize form with react-hook-form and zod validation
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "",
      tags: [],
      html: "",
      jsonData: {},
      isVisible: true,
      production: false,
    },
  });

  // Get current values from form
  const { tags, html, jsonData, isVisible, production } = form.watch();

  // Fix for FormField control prop
  const { control } = form;
  const typedControl = control as FormControlType;

  // Fetch template data
  useEffect(() => {
    if (!templateId) {
      toast.error("Template ID is required");
      router.push("/dashboard/templates");
      return;
    }

    const fetchTemplate = async () => {
      try {
        console.log("Fetching template with ID:", templateId);
        const response = await fetch(`/api/templates/${templateId}`);
        
        if (!response.ok) {
          console.error("API response not OK:", response.status, response.statusText);
          throw new Error(`Failed to fetch template: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("API response data:", data);
        
        const template = data.template;
        
        if (!template) {
          console.error("Template data is missing in API response:", data);
          throw new Error("Template data is missing");
        }

        console.log("Fetched template:", template);
        
        // Get HTML content
        let htmlContent = "";
        
        // If htmlRef appears to be a filename instead of raw HTML, try to fetch it from htmlUrl
        if (template.htmlUrl) {
          console.log("Fetching HTML from URL:", template.htmlUrl);
          try {
            const htmlResponse = await fetch(template.htmlUrl);
            if (htmlResponse.ok) {
              htmlContent = await htmlResponse.text();
              console.log("HTML content fetched successfully", htmlContent.substring(0, 100) + "...");
            } else {
              console.warn("HTML fetch failed, using htmlRef instead:", template.htmlRef);
              htmlContent = template.htmlRef;
            }
          } catch (htmlError) {
            console.error("Error fetching HTML content:", htmlError);
            htmlContent = template.htmlRef;
          }
        } else {
          console.log("Using htmlRef directly as content:", template.htmlRef);
          htmlContent = template.htmlRef;
        }
        
        // Update form with template data - ensure all fields are populated correctly
        const formData = {
          name: template.name || "",
          type: template.type || "",
          tags: template.tags || [],
          html: htmlContent || "",
          jsonData: template.jsonData || {},
          isVisible: template.isVisible !== undefined ? template.isVisible : true,
          production: template.production !== undefined ? template.production : false,
        };
        
        console.log("Updating form with data:", formData);
        form.reset(formData);
      } catch (error) {
        console.error("Error fetching template:", error);
        toast.error("Failed to load template");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplate();
  }, [templateId, form, router]);

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

  const onSubmit: SubmitHandler<FormValues> = (values) => {
    if (!templateId) return;
    
    setIsSaving(true);
    console.log("Submitting form values:", values);

    fetch(`/api/templates/${templateId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        template: {
          htmlRef: values.html, // This sends the HTML content directly
          type: values.type,
          tags: values.tags,
          name: values.name,
          jsonData: values.jsonData,
          isVisible: values.isVisible,
          production: values.production,
        },
      }),
    })
    .then(response => {
      console.log("Update response status:", response.status, response.statusText);
      return response.json();
    })
    .then(result => {
      console.log("Update response data:", result);

      if (result.template) {
        toast.success("Template updated successfully!");
        // Give a slight delay before redirecting to allow the success toast to be seen
        setTimeout(() => {
          router.push("/dashboard/templates");
        }, 1500);
      } else {
        toast.error(`Failed to update: ${result.error || "Unknown error"}`);
      }
    })
    .catch(error => {
      console.error("Error updating template:", error);
      toast.error("Failed to update template");
    })
    .finally(() => {
      setIsSaving(false);
    });
  };

  const handleDeleteTemplate = async () => {
    if (!templateId) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Template deleted successfully");
        // Redirect to templates list
        setTimeout(() => {
          router.push("/dashboard/templates");
        }, 1500);
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete template");
      }
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error(`Failed to delete template: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Add this function to handle image download
  const handleDownloadImage = async () => {
    try {
      setIsDownloading(true);
      
      // Get the current HTML and template data
      const htmlTemplate = form.getValues("html");
      const templateData = form.getValues("jsonData");
      
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
      const templateName = form.getValues("name") || 'template';
      a.download = `${templateName}.jpg`;
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

  // Add a function to toggle template visibility
  const toggleVisibility = async () => {
    if (!templateId) return;
    
    try {
      const response = await fetch(`/api/templates/${templateId}/visibility`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isVisible: !isVisible
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Visibility update response:", result);
        
        // Update form state
        form.setValue("isVisible", !isVisible);
        
        // Show success message
        toast.success(`Template ${!isVisible ? 'shown' : 'hidden'} successfully`);
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to update visibility");
      }
    } catch (error) {
      console.error("Error toggling template visibility:", error);
      toast.error("Failed to update template visibility");
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-screen">
        <div className="animate-pulse">Loading template...</div>
      </div>
    );
  }

  return (
    <main className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Edit Template</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/templates")}
          >
            Cancel
          </Button>
          <Button
            variant={isVisible ? "default" : "secondary"}
            onClick={toggleVisibility}
          >
            {isVisible ? (
              <span className="flex items-center gap-1"><Eye size={16} /> Hide Template</span>
            ) : (
              <span className="flex items-center gap-1"><EyeOff size={16} /> Show Template</span>
            )}
          </Button>
          <Button
            variant="secondary"
            onClick={handleDownloadImage}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <span className="flex items-center gap-1">
                <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full inline-block"></span>
                Downloading...
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Download size={16} />
                Download Image
              </span>
            )}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Template</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this template? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteTemplate}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            size="lg"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-5 p-6 border border-gray-200 rounded-md bg-gray-50">
                <h2 className="text-lg font-semibold">Template Metadata</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={typedControl}
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
                    control={typedControl}
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

                <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-6 mt-4">
                  <FormField
                    control={typedControl}
                    name="isVisible"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Visible in Library
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={typedControl}
                    name="production"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Production Ready
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={typedControl}
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
                control={typedControl}
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
                control={typedControl}
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

export default function EditTemplate() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <EditTemplateContent />
    </Suspense>
  );
}
