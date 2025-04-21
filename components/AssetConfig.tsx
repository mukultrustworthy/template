import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Share } from 'lucide-react';
import { AssetImageDto } from '@/types/asset';

type AssetConfigProps = {
  assetData: AssetImageDto;
  selectedAssetType: AssetImageDto['type'];
  isPublishing: boolean;
  tags: string[];
  tagInput: string;
  templateName: string;
  setTagInput: (value: string) => void;
  setTemplateName: (value: string) => void;
  onAssetTypeChange: (value: AssetImageDto['type']) => void;
  onUpdateAssetData: (fieldPath: string[], value: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
  onPublish: () => void;
};

export default function AssetConfig({
  assetData,
  selectedAssetType,
  isPublishing,
  tags,
  tagInput,
  templateName,
  setTagInput,
  setTemplateName,
  onAssetTypeChange,
  onUpdateAssetData,
  onAddTag,
  onRemoveTag,
  onPublish
}: AssetConfigProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Asset Data Configuration</CardTitle>
        <CardDescription>Define the structure and content of your asset.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="template-name">Template Name</Label>
          <Input
            id="template-name"
            placeholder="Enter template name"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="asset-type">Asset Type</Label>
          <Select 
            value={selectedAssetType} 
            onValueChange={(value) => onAssetTypeChange(value as AssetImageDto['type'])}
          >
            <SelectTrigger id="asset-type">
              <SelectValue placeholder="Select asset type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="rating-summary">Rating Summary</SelectItem>
              <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
              <SelectItem value="multiple-choice-individual">Multiple Choice Individual</SelectItem>
              <SelectItem value="google">Google</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="multiple-choice-text">Multiple Choice Text</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="brandLogoUrl">Brand Logo URL</Label>
          <Input 
            id="brandLogoUrl"
            type="url" 
            placeholder="https://example.com/logo.png"
            value={assetData.brandLogoUrl || ''}
            onChange={(e) => onUpdateAssetData(['brandLogoUrl'], e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="question">Question</Label>
          <Input 
            id="question"
            placeholder="Enter the question text"
            value={assetData.question || ''}
            onChange={(e) => onUpdateAssetData(['question'], e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="answer">Answer</Label>
          <Input 
            id="answer"
            placeholder="Enter the answer text"
            value={assetData.answer}
            onChange={(e) => onUpdateAssetData(['answer'], e.target.value)}
          />
        </div>
        
        <Separator />
        <h4 className="text-sm font-medium text-muted-foreground pt-2">Author Details</h4>
        <div className="grid gap-2">
          <Label htmlFor="authorName">Author Name</Label>
          <Input 
            id="authorName"
            placeholder="John Doe"
            value={assetData.author.name}
            onChange={(e) => onUpdateAssetData(['author', 'name'], e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="authorDesignation">Author Designation</Label>
          <Input 
            id="authorDesignation"
            placeholder="CEO, Example Inc."
            value={assetData.author.designation}
            onChange={(e) => onUpdateAssetData(['author', 'designation'], e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="authorImage">Author Image URL</Label>
          <Input 
            id="authorImage"
            type="url"
            placeholder="https://example.com/author.jpg"
            value={assetData.author.image || ''}
            onChange={(e) => onUpdateAssetData(['author', 'image'], e.target.value)}
          />
        </div>
        
        <Separator />
        <h4 className="text-sm font-medium text-muted-foreground pt-2">Styling</h4>
        <div className="grid gap-2">
          <Label htmlFor="accentColor">Accent Color</Label>
          <Input 
            id="accentColor"
            placeholder="#FF0000"
            value={assetData.accentColor || ''}
            onChange={(e) => onUpdateAssetData(['accentColor'], e.target.value)}
          />
        </div>
        
        <Separator />
        <h4 className="text-sm font-medium text-muted-foreground pt-2">Template Tags</h4>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Add a tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onAddTag()}
            />
            <Button variant="outline" onClick={onAddTag} type="button">
              Add
            </Button>
          </div>
          
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map(tag => (
                <div key={tag} className="flex items-center bg-muted rounded-full pl-3 pr-2 py-1 text-xs">
                  {tag}
                  <button 
                    className="ml-1 text-muted-foreground hover:text-foreground"
                    onClick={() => onRemoveTag(tag)}
                  >
                    <span aria-hidden="true">×</span>
                    <span className="sr-only">Remove {tag}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Button 
          onClick={onPublish} 
          className="w-full" 
          variant="default" 
          disabled={isPublishing}
        >
          <Share className="mr-2 h-4 w-4" /> 
          {isPublishing ? 'Publishing...' : 'Publish to Library'}
        </Button>
      </CardFooter>
    </Card>
  );
} 