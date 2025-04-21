'use client';

import { useState } from 'react';
import { Toaster, toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import HtmlEditor from '@/components/HtmlEditor';
import JsonEditor from '@/components/JsonEditor';
import TemplatePreview from '@/components/TemplatePreview';
import { DEFAULT_HTML, DEFAULT_JSON } from '@/components/templates/default-testimonial';

export default function Home() {
  const [html, setHtml] = useState<string>(DEFAULT_HTML);
  const [jsonData, setJsonData] = useState<Record<string, unknown>>(DEFAULT_JSON);
  const [isPublishing, setIsPublishing] = useState(false);
  const [name, setName] = useState<string>("New Template");
  const [type, setType] = useState<string>("testimonial");
  const [tags, setTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState<string>("");

  const handleAddTag = () => {
    if (customTagInput.trim()) {
      setTags([...tags, customTagInput.trim()]);
      setCustomTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          design: {
            name,
            version: 1,
            isLatest: true,
            publishedAt: new Date().toISOString(),
            createdBy: 'editor-user',
            placeholders: jsonData
          },
          template: {
            html,
            type,
            tags
          }
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        toast.success("Template published to library successfully!");
      } else {
        toast.error(`Failed to publish: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error publishing template:', error);
      toast.error("Failed to publish template");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <main className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">HTML Template Editor</h1>
        <div className="flex gap-2">
          <Button 
            onClick={handlePublish} 
            disabled={isPublishing}
          >
            {isPublishing ? "Publishing..." : "Publish to Library"}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/library">View Library</Link>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="space-y-5 p-4 border border-gray-200 rounded-md bg-gray-50">
            <h2 className="text-lg font-semibold">Template Metadata</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="template-name" className="font-medium">Template Name</Label>
                <input 
                  id="template-name"
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="template-type" className="font-medium">Template Type</Label>
                {type === 'custom' ? (
                  <div className="flex gap-2">
                    <input 
                      id="template-type-custom"
                      type="text" 
                      value={type === 'custom' ? '' : type}
                      onChange={(e) => setType(e.target.value || 'custom')}
                      className="flex-1 h-10 p-2 border border-gray-300 rounded-md"
                      placeholder="Enter custom type"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => setType('testimonial')}
                      className="h-10"
                    >
                      Back to List
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <select 
                      id="template-type"
                      value={type} 
                      onChange={(e) => setType(e.target.value)}
                      className="flex-1 h-10 p-2 border border-gray-300 rounded-md"
                    >
                      <option value="testimonial">Testimonial</option>
                      <option value="text">Text</option>
                      <option value="video">Video</option>
                      <option value="rating">Rating</option>
                      <option value="rating-summary">Rating Summary</option>
                      <option value="multiple-choice">Multiple Choice</option>
                      <option value="multiple-choice-individual">Multiple Choice Individual</option>
                      <option value="multiple-choice-text">Multiple Choice Text</option>
                      <option value="google">Google</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="youtube">YouTube</option>
                      <option value="case-study">Case Study</option>
                      <option value="banner">Banner</option>
                    </select>
                    <Button 
                      variant="outline" 
                      onClick={() => setType('custom')}
                      className="h-10"
                    >
                      Add Custom
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tags-input" className="font-medium">Tags</Label>
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
              <div className="flex gap-2">
                <input
                  id="tags-input"
                  type="text"
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add a tag and press Enter"
                  className="flex-1 h-10 p-2 border border-gray-300 rounded-md"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleAddTag}
                  className="h-10"
                >
                  Add Tag
                </Button>
              </div>
            </div>
          </div>

          <HtmlEditor 
            html={html} 
            onChange={setHtml} 
          />
          
          <JsonEditor 
            json={jsonData} 
            onChange={setJsonData} 
          />
        </div>
        
        <div>
          <div className="sticky top-6 space-y-6"> 
            <TemplatePreview 
              html={html} 
              data={jsonData} 
            />
          </div>
        </div>
      </div>
      <Toaster richColors position="top-right" /> 
    </main>
  );
}
