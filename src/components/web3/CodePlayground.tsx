import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Save, Code2, GitFork, ExternalLink, Play, AlertCircle } from "lucide-react";
import { useSaveCodeSnippet, useUpdateCodeSnippet, useForkCodeSnippet, CodeSnippet } from "@/hooks/use-code-snippets";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CodePlaygroundProps {
  initialCode?: string;
  initialSnippet?: CodeSnippet | null;
  onFork?: (snippet: CodeSnippet) => void;
}

const DEFAULT_CODE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract HelloWorld {
    string public message;
    
    constructor() {
        message = "Hello, Web3 India!";
    }
    
    function setMessage(string memory newMessage) public {
        message = newMessage;
    }
    
    function getMessage() public view returns (string memory) {
        return message;
    }
}`;

export const CodePlayground = ({ initialCode = "", initialSnippet = null, onFork }: CodePlaygroundProps) => {
  const [code, setCode] = useState(initialCode || DEFAULT_CODE);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [title, setTitle] = useState(initialSnippet?.title || "");
  const [description, setDescription] = useState(initialSnippet?.description || "");
  const [isPublic, setIsPublic] = useState(initialSnippet?.is_public ?? true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
    }
  }, [initialCode]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [code]);

  const saveSnippet = useSaveCodeSnippet();
  const updateSnippet = useUpdateCodeSnippet();
  const forkSnippet = useForkCodeSnippet();

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Please provide a title for your snippet");
      return;
    }

    if (initialSnippet) {
      await updateSnippet.mutateAsync({
        id: initialSnippet.id,
        title,
        description,
        is_public: isPublic,
      });
    } else {
      await saveSnippet.mutateAsync({
        title,
        description,
        code,
        language: "solidity",
        is_public: isPublic,
      });
    }

    setIsSaveDialogOpen(false);
  };

  const handleFork = async () => {
    if (!initialSnippet) return;
    const forked = await forkSnippet.mutateAsync(initialSnippet);
    if (onFork) {
      onFork(forked);
    }
  };

  const openInRemix = () => {
    try {
      const encodedCode = btoa(unescape(encodeURIComponent(code)));
      const remixUrl = `https://remix.ethereum.org/#code=${encodedCode}&lang=en&optimize=false`;
      window.open(remixUrl, "_blank");
      toast.info("Opening in Remix IDE with your code!");
    } catch (error) {
      toast.error("Failed to open in Remix IDE");
    }
  };

  const handleRunCode = () => {
    toast.info("To compile and run, click 'Open in Remix IDE' button!");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Code2 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Smart Contract Playground</h3>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunCode}
          >
            <Play className="h-4 w-4 mr-2" />
            Compile & Run
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={openInRemix}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in Remix IDE
          </Button>

          {initialSnippet && !initialSnippet.forked_from && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleFork}
              disabled={forkSnippet.isPending}
            >
              <GitFork className="h-4 w-4 mr-2" />
              Fork
            </Button>
          )}

          <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save Snippet
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Code Snippet</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="My Smart Contract"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what your contract does..."
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is-public"
                    checked={isPublic}
                    onCheckedChange={setIsPublic}
                  />
                  <Label htmlFor="is-public">Make public</Label>
                </div>
                <Button
                  onClick={handleSave}
                  disabled={saveSnippet.isPending || updateSnippet.isPending}
                  className="w-full"
                >
                  {initialSnippet ? "Update" : "Save"} Snippet
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Code Editor */}
      <div className="border border-border rounded-lg overflow-hidden bg-background">
        <Textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="min-h-[600px] font-mono text-sm p-4 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 border-0"
          placeholder="// Write your Solidity code here..."
          spellCheck={false}
        />
      </div>

      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <Code2 className="h-4 w-4" />
          Quick Tips
        </h4>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li>• Write your Solidity smart contracts in the editor above</li>
          <li>• Click "Compile & Run" to test in Remix IDE (opens in new tab)</li>
          <li>• Use "Open in Remix IDE" to continue editing with full IDE features</li>
          <li>• Save your code snippets to access them later from "My Snippets"</li>
          <li>• Fork community snippets from "Examples" to learn and modify</li>
          <li>• Press Tab for indentation, Ctrl+Z to undo</li>
        </ul>
      </div>
    </div>
  );
};
