'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ElementDataMapping } from '@/utils/htmlInspector';
import { Toaster } from "sonner";
import { toast } from "sonner";
import { Copy, Search, Clock, ArrowLeft, ExternalLink, Download } from 'lucide-react';

// Template record type definition
interface TemplateRecord {
  id: string;
  assetId: string;
  type: string;
  version: string;
  isLatest: boolean;
  publishedAt: string;
  createdBy: string;
  updatedAt: string;
  tags: string[];
  mappings: ElementDataMapping[];
  htmlUrl: string;
}

export default function LibraryPage() {
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [allTags, setAllTags] = useState<string[]>([]);

  // Fetch templates on component mount
  useEffect(() => {
    async function fetchTemplates() {
      try {
        setLoading(true);
        const response = await fetch('/api/templates');
        const data = await response.json();
        
        if (data.templates) {
          setTemplates(data.templates);
          
          // Extract all unique tags for filtering
          const tags = new Set<string>();
          data.templates.forEach((template: TemplateRecord) => {
            template.tags.forEach(tag => tags.add(tag));
          });
          setAllTags(Array.from(tags));
        }
      } catch (error) {
        console.error('Failed to fetch templates:', error);
        toast.error('Failed to load asset templates');
      } finally {
        setLoading(false);
      }
    }
    
    fetchTemplates();
  }, []);

  // Filter templates based on search term and tags
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = 
      searchTerm === '' || 
      template.assetId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.createdBy.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTag = filterTag === '' || template.tags.includes(filterTag);
    
    return matchesSearch && matchesTag;
  });

  // Get a preview URL (this would be a real preview in production)
  const getPreviewUrl = (template: TemplateRecord) => {
    return template.htmlUrl || '#';
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Copy asset ID to clipboard
  const copyAssetId = (assetId: string) => {
    navigator.clipboard.writeText(assetId)
      .then(() => toast.success(`Copied ID: ${assetId}`))
      .catch(() => toast.error('Failed to copy ID'));
  };

  // Export template files (both JSON and HTML)
  const exportTemplate = async (template: TemplateRecord) => {
    try {
      // Fetch the HTML content from the template URL
      // In a real implementation, this would fetch from S3 or wherever the HTML is stored
      let htmlContent = '';
      
      // For demo purposes, if we can't fetch the real HTML (since it's mocked),
      // we'll create sample HTML content with placeholders
      try {
        const response = await fetch(template.htmlUrl);
        if (response.ok) {
          htmlContent = await response.text();
        } else {
          throw new Error('Failed to fetch HTML content');
        }
      } catch {
        console.warn('Using placeholder HTML since real content could not be fetched');
        // Create a simple HTML template with placeholders for demo
        htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>${template.type} Template</title>
  <meta charset="utf-8">
</head>
<body>
  <!-- This is a placeholder HTML for the template: ${template.id} -->
  <div class="template-container">
    ${template.mappings.map(mapping => {
      const fieldPath = mapping.fieldPath.join('.');
      return `<div data-field="${fieldPath}">{{${fieldPath}}}</div>`;
    }).join('\n    ')}
  </div>
</body>
</html>`;
      }
      
      // Export JSON metadata - use the exact MongoDB document structure
      const jsonStr = JSON.stringify(template, null, 2);
      const jsonBlob = new Blob([jsonStr], { type: 'application/json' });
      const jsonUrl = URL.createObjectURL(jsonBlob);
      
      // Export HTML file
      const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
      const htmlUrl = URL.createObjectURL(htmlBlob);
      
      // Create a name for the export files
      const baseFileName = `${template.assetId}_v${template.version}`;
      
      // Download JSON file
      const jsonLinkElement = document.createElement('a');
      jsonLinkElement.href = jsonUrl;
      jsonLinkElement.download = `${baseFileName}.json`;
      document.body.appendChild(jsonLinkElement);
      jsonLinkElement.click();
      
      // Small delay between downloads to avoid browser issues
      setTimeout(() => {
        // Download HTML file
        const htmlLinkElement = document.createElement('a');
        htmlLinkElement.href = htmlUrl;
        htmlLinkElement.download = `${baseFileName}.html`;
        document.body.appendChild(htmlLinkElement);
        htmlLinkElement.click();
        
        // Clean up
        document.body.removeChild(htmlLinkElement);
        URL.revokeObjectURL(htmlUrl);
        
        toast.success("Template files exported successfully!");
      }, 100);
      
      // Clean up JSON download
      document.body.removeChild(jsonLinkElement);
      URL.revokeObjectURL(jsonUrl);
      
    } catch (error) {
      console.error('Error exporting template:', error);
      toast.error('Failed to export template files');
    }
  };

  return (
    <main className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Asset Template Library</h1>
          <p className="text-muted-foreground mt-1">Browse and manage your asset templates</p>
        </div>
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <ArrowLeft size={16} />
            Back to Editor
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Search Templates</CardTitle>
          <CardDescription>Find templates by ID, type, or creator</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by asset ID, type or creator..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="w-full md:w-64">
              <Label htmlFor="tag-filter" className="sr-only">Filter by Tag</Label>
              <select
                id="tag-filter"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
              >
                <option value="">All tags</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
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
          <p className="text-xl font-medium mb-2">No templates found</p>
          <p className="text-muted-foreground mb-6">
            {searchTerm || filterTag ? 'Try adjusting your search filters' : 'Create your first template to get started'}
          </p>
          <Link href="/">
            <Button>Create New Template</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="flex flex-col overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg line-clamp-1">{template.type} Template</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <span 
                        className="font-mono text-xs"
                        title={template.assetId}
                      >
                        {template.assetId}
                      </span>
                      <button 
                        onClick={() => copyAssetId(template.assetId)}
                        className="text-muted-foreground hover:text-primary"
                        title="Copy ID"
                      >
                        <Copy size={12} />
                      </button>
                    </CardDescription>
                  </div>
                  <Badge variant={template.isLatest ? "default" : "outline"}>
                    v{template.version}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="py-2 flex-1">
                <div className="flex items-center text-xs text-muted-foreground mb-3">
                  <Clock size={14} className="mr-1" />
                  <span>
                    {formatDate(template.updatedAt)}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {template.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {template.tags.length === 0 && (
                    <span className="text-xs text-muted-foreground italic">No tags</span>
                  )}
                </div>
                
                <Separator className="my-3" />
                
                <div className="text-xs text-muted-foreground">
                  <p><strong>Fields: </strong>{template.mappings.length}</p>
                  <p><strong>Created by: </strong>{template.createdBy}</p>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1" asChild>
                  <Link href={getPreviewUrl(template)} target="_blank">
                    <ExternalLink size={14} /> Preview
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 gap-1"
                  onClick={() => exportTemplate(template)}
                >
                  <Download size={14} /> Export
                </Button>
                <Button size="sm" className="flex-1">
                  Use
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      <Toaster richColors position="top-right" />
    </main>
  );
} 