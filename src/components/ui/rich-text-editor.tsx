import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import Strike from '@tiptap/extension-strike';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Youtube from '@tiptap/extension-youtube';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ColorPicker } from '@/components/ui/color-picker';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Link2,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Heading3,
  CheckSquare,
  Minus,
  Table as TableIcon,
  Youtube as YoutubeIcon,
  Undo,
  Redo,
  RemoveFormatting,
  Type,
  Highlighter as HighlightIcon,
  FileCode,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
} from 'lucide-react';
import { useCallback, useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Newspaper, Smartphone, Sparkles } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const [markdownMode, setMarkdownMode] = useState(false);
  const [htmlContent, setHtmlContent] = useState(content);
  const [markdownContent, setMarkdownContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageCaption, setImageCaption] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isFormattingNews, setIsFormattingNews] = useState(false);
  const [showCodeBlockDialog, setShowCodeBlockDialog] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [codeContent, setCodeContent] = useState('');

  const lowlight = createLowlight(common);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
          HTMLAttributes: {
            class: null,
          },
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
          HTMLAttributes: {
            class: null,
          },
        },
        bold: {
          HTMLAttributes: {
            class: null,
          },
        },
        italic: {
          HTMLAttributes: {
            class: null,
          },
        },
        paragraph: {
          HTMLAttributes: {
            class: null,
          },
        },
        codeBlock: false, // Disable default code block to use CodeBlockLowlight
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'code-block-editor',
        },
      }),
      Underline.configure({
        HTMLAttributes: {
          class: null,
        },
      }),
      Strike.configure({
        HTMLAttributes: {
          class: null,
        },
      }),
      Subscript.configure({
        HTMLAttributes: {
          class: null,
        },
      }),
      Superscript.configure({
        HTMLAttributes: {
          class: null,
        },
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
        HTMLAttributes: {
          class: null,
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 dark:text-blue-400 underline cursor-pointer hover:text-blue-700 dark:hover:text-blue-300 transition-colors',
          rel: 'noopener noreferrer nofollow',
          target: '_blank',
        },
        validate: (href) => {
          // Allow relative URLs for internal links
          return /^(https?:\/\/|\/|mailto:|tel:)/.test(href);
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: null,
          loading: 'lazy',
          decoding: 'async'
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: null,
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: null,
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: null,
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: null,
        },
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: null,
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: null,
        },
      }),
      HorizontalRule.configure({
        HTMLAttributes: {
          class: null,
        },
      }),
      Youtube.configure({
        width: 640,
        height: 480,
        HTMLAttributes: {
          class: null,
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      let html = editor.getHTML();
      // Clean up TipTap classes and attributes before saving
      html = html
        .replace(/\sclass="[^"]*"/g, '') // Remove all class attributes
        .replace(/\sdata-[a-z-]+="[^"]*"/g, '') // Remove data attributes from TipTap
        .replace(/<p>\s*<\/p>/g, ''); // Remove empty paragraphs
      setHtmlContent(html);
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: 'article-content prose prose-invert max-w-none min-h-[400px] focus:outline-none p-4 text-foreground prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-code:text-foreground prose-pre:bg-muted prose-pre:text-foreground prose-blockquote:text-muted-foreground prose-li:text-foreground',
      },
    },
  });

  // Sync external content updates (e.g., AI actions) into TipTap editor
  useEffect(() => {
    if (!editor) return;
    if (content && content !== htmlContent) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor, htmlContent]);

  const uploadImage = useCallback(async (file: File) => {
    try {
      // Show optimization progress
      toast({
        title: "Optimizing image...",
        description: "Compressing and preparing your image",
      });

      // Optimize the image
      const { optimizeImage, formatFileSize } = await import('@/lib/image-optimizer');
      const optimized = await optimizeImage(file, (progress) => {
        console.log(`Optimization progress: ${progress}%`);
      });

      // Upload optimized version
      const fileExt = optimized.optimizedFile.type.split('/')[1];
      const fileName = `${Date.now()}-optimized.${fileExt}`;
      const filePath = `article-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('article-images')
        .upload(filePath, optimized.optimizedFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('article-images')
        .getPublicUrl(filePath);

      // Show success with compression stats
      toast({
        title: "Image optimized!",
        description: `Reduced by ${optimized.compressionRatio}% (${formatFileSize(optimized.originalSize)} → ${formatFileSize(optimized.optimizedSize)})`,
      });

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
      return null;
    }
  }, []);

  const handleImageUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = await uploadImage(file);
      if (url) {
        setUploadedImageUrl(url);
        setShowImageDialog(true);
      }
    }
    // Reset file input
    if (event.target) {
      event.target.value = '';
    }
  }, [uploadImage]);

  const handleInsertImage = useCallback(() => {
    if (!editor || !uploadedImageUrl) return;

    const alt = imageAlt || 'Article image';
    const caption = imageCaption.trim() || alt;
    
    // Always insert with figure and figcaption (using caption if provided, otherwise alt text)
    const figureHtml = `<figure><img src="${uploadedImageUrl}" alt="${alt}" /><figcaption>${caption}</figcaption></figure><p><br /></p>`;
    editor.chain().focus().insertContent(figureHtml).run();

    // Reset state
    setShowImageDialog(false);
    setImageCaption('');
    setImageAlt('');
    setUploadedImageUrl(null);
  }, [editor, uploadedImageUrl, imageCaption, imageAlt]);

  const addLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addYouTubeVideo = useCallback(() => {
    const url = window.prompt('Enter YouTube URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID)');
    if (url) {
      try {
        editor?.commands.setYoutubeVideo({ src: url, width: 640, height: 480 });
        toast({
          title: "Video Added",
          description: "YouTube video has been embedded successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Invalid YouTube URL. Please use a valid YouTube video link.",
          variant: "destructive",
        });
      }
    }
  }, [editor]);

  const insertTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  const insertCodeBlock = useCallback(() => {
    setShowCodeBlockDialog(true);
  }, []);

  const handleInsertCodeBlock = useCallback(() => {
    if (!editor || !codeContent.trim()) {
      toast({
        title: "No code",
        description: "Please write some code before inserting",
        variant: "destructive",
      });
      return;
    }
    
    // Insert code block with the content
    editor.chain().focus().insertContent({
      type: 'codeBlock',
      attrs: { language: codeLanguage },
      content: [{
        type: 'text',
        text: codeContent
      }]
    }).run();
    
    // Reset and close
    setShowCodeBlockDialog(false);
    setCodeContent('');
    setCodeLanguage('javascript');
  }, [editor, codeLanguage, codeContent]);

  const toggleMarkdownMode = useCallback(() => {
    if (!editor) return;
    
    if (markdownMode) {
      // Switch from markdown to WYSIWYG
      editor.commands.setContent(htmlContent);
      setMarkdownMode(false);
    } else {
      // Switch to markdown
      const html = editor.getHTML();
      // Simple HTML to markdown conversion
      const markdown = html
        .replace(/<h1>(.*?)<\/h1>/g, '# $1')
        .replace(/<h2>(.*?)<\/h2>/g, '## $1')
        .replace(/<h3>(.*?)<\/h3>/g, '### $1')
        .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
        .replace(/<em>(.*?)<\/em>/g, '*$1*')
        .replace(/<br>/g, '\n');
      setMarkdownContent(markdown);
      setMarkdownMode(true);
    }
  }, [editor, markdownMode, htmlContent]);

  const handleMarkdownChange = useCallback((value: string) => {
    setMarkdownContent(value);
    // Simple markdown to HTML conversion for basic cases
    // In a real app, you'd use a proper markdown parser
    const html = value
      .replace(/^# (.*)/gm, '<h1>$1</h1>')
      .replace(/^## (.*)/gm, '<h2>$1</h2>')
      .replace(/^### (.*)/gm, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
    
    setHtmlContent(html);
    onChange(html);
  }, [onChange]);

  const handleFormatAsNews = useCallback(async () => {
    if (!editor) return;
    
    const currentContent = editor.getHTML();
    if (!currentContent || currentContent === '<p></p>') {
      toast({
        title: "No content",
        description: "Please add some content first before formatting",
        variant: "destructive",
      });
      return;
    }

    setIsFormattingNews(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-proxy', {
        body: { 
          task: 'format-as-news',
          content: currentContent 
        }
      });

      if (error) throw error;

      if (data?.result) {
        editor.commands.setContent(data.result);
        toast({
          title: "Formatted as News",
          description: "Content has been reformatted in news article style",
        });
      }
    } catch (error) {
      console.error('Error formatting as news:', error);
      toast({
        title: "Error",
        description: "Failed to format content as news article",
        variant: "destructive",
      });
    } finally {
      setIsFormattingNews(false);
    }
  }, [editor]);

  const handleFormatAsListicle = useCallback(async () => {
    if (!editor) return;
    
    const currentContent = editor.getHTML();
    if (!currentContent || currentContent === '<p></p>') {
      toast({
        title: "No content",
        description: "Please add some content first before formatting",
        variant: "destructive",
      });
      return;
    }

    setIsFormattingNews(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-proxy', {
        body: { 
          task: 'format-as-listicle',
          content: currentContent 
        }
      });

      if (error) throw error;

      if (data?.result) {
        editor.commands.setContent(data.result);
        toast({
          title: "Formatted as Listicle",
          description: "Content has been reformatted as an engaging listicle",
        });
      }
    } catch (error) {
      console.error('Error formatting as listicle:', error);
      toast({
        title: "Error",
        description: "Failed to format content as listicle",
        variant: "destructive",
      });
    } finally {
      setIsFormattingNews(false);
    }
  }, [editor]);

  const handleFormatAsGadgetReview = useCallback(async () => {
    if (!editor) return;
    
    const currentContent = editor.getHTML();
    if (!currentContent || currentContent === '<p></p>') {
      toast({
        title: "No content",
        description: "Please add gadget details first before formatting",
        variant: "destructive",
      });
      return;
    }

    setIsFormattingNews(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('format-gadget-review', {
        body: { 
          title: 'Gadget Review',
          content: currentContent 
        }
      });

      if (error) throw error;

      if (data?.formattedContent) {
        editor.commands.setContent(data.formattedContent);
        toast({
          title: "Formatted as Gadget Review",
          description: "Content has been reformatted as a professional tech review",
        });
      }
    } catch (error: any) {
      console.error('Error formatting as gadget review:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to format content as gadget review",
        variant: "destructive",
      });
    } finally {
      setIsFormattingNews(false);
    }
  }, [editor]);

  const handleFormatAsWeb3Article = useCallback(async () => {
    if (!editor) return;
    
    const currentContent = editor.getHTML();
    if (!currentContent || currentContent === '<p></p>') {
      toast({
        title: "No content",
        description: "Please add Web3 article content first before formatting",
        variant: "destructive",
      });
      return;
    }

    setIsFormattingNews(true);
    
    try {
      const currentTitle = editor.getText().split('\n')[0] || 'Web3 Article';
      
      const { data, error } = await supabase.functions.invoke('format-web3-article', {
        body: { 
          title: currentTitle,
          content: currentContent 
        }
      });

      if (error) throw error;

      if (data?.formattedContent) {
        editor.commands.setContent(data.formattedContent);
        toast({
          title: "Formatted as Web3 Article",
          description: `Content formatted with GFG structure. ${data.relatedArticlesCount || 0} related articles linked.`,
        });
      }
    } catch (error: any) {
      console.error('Error formatting as Web3 article:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to format content as Web3 article",
        variant: "destructive",
      });
    } finally {
      setIsFormattingNews(false);
    }
  }, [editor]);

  if (!editor && !markdownMode) {
    return null;
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-3 border-b border-border bg-muted/30">
        {/* Mode Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMarkdownMode}
          className={markdownMode ? 'bg-accent' : ''}
        >
          <FileCode className="h-4 w-4" />
        </Button>
        
        <Separator orientation="vertical" className="h-6" />

        {!markdownMode && editor && (
          <>
            {/* AI Actions */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFormatAsNews}
              disabled={isFormattingNews}
              className="text-blue-600 dark:text-blue-400"
              title="Format as News Article"
            >
              {isFormattingNews ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Newspaper className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleFormatAsListicle}
              disabled={isFormattingNews}
              className="text-purple-600 dark:text-purple-400"
              title="Format as Listicle"
            >
              {isFormattingNews ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <List className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleFormatAsGadgetReview}
              disabled={isFormattingNews}
              className="text-green-600 dark:text-green-400"
              title="Format as Gadget Review"
            >
              {isFormattingNews ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Smartphone className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleFormatAsWeb3Article}
              disabled={isFormattingNews}
              className="text-purple-600 dark:text-purple-400 bg-gradient-to-r from-purple-500/10 to-blue-500/10 hover:from-purple-500/20 hover:to-blue-500/20"
              title="Format as Web3 Article (GeeksforGeeks Style)"
            >
              {isFormattingNews ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
            </Button>
            
            <Separator orientation="vertical" className="h-6" />

            {/* Headings */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={editor.isActive('heading', { level: 1 }) ? 'bg-accent' : ''}
            >
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={editor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}
            >
              <Heading2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={editor.isActive('heading', { level: 3 }) ? 'bg-accent' : ''}
            >
              <Heading3 className="h-4 w-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-6" />
            
            {/* Text Formatting */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={editor.isActive('bold') ? 'bg-accent' : ''}
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={editor.isActive('italic') ? 'bg-accent' : ''}
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={editor.isActive('underline') ? 'bg-accent' : ''}
            >
              <UnderlineIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={editor.isActive('strike') ? 'bg-accent' : ''}
            >
              <Strikethrough className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleSubscript().run()}
              className={editor.isActive('subscript') ? 'bg-accent' : ''}
            >
              <SubscriptIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleSuperscript().run()}
              className={editor.isActive('superscript') ? 'bg-accent' : ''}
            >
              <SuperscriptIcon className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="h-6" />

            {/* Colors */}
            <ColorPicker
              value={editor.getAttributes('textStyle').color}
              onChange={(color) => editor.chain().focus().setColor(color).run()}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              className={editor.isActive('highlight') ? 'bg-accent' : ''}
            >
              <HighlightIcon className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="h-6" />
            
            {/* Lists */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={editor.isActive('bulletList') ? 'bg-accent' : ''}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={editor.isActive('orderedList') ? 'bg-accent' : ''}
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              className={editor.isActive('taskList') ? 'bg-accent' : ''}
            >
              <CheckSquare className="h-4 w-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-6" />
            
            {/* Block Elements */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={editor.isActive('blockquote') ? 'bg-accent' : ''}
            >
              <Quote className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={insertCodeBlock}
              className={editor.isActive('codeBlock') ? 'bg-accent' : ''}
              title="Insert Code Block"
            >
              <Code className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
            >
              <Minus className="h-4 w-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-6" />
            
            {/* Media & Links */}
            <Button variant="ghost" size="sm" onClick={addLink}>
              <Link2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleImageUpload}>
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={addYouTubeVideo}>
            <YoutubeIcon className="h-4 w-4 mr-2" />
            Embed Video
            </Button>

            <Separator orientation="vertical" className="h-6" />

            {/* Table */}
            <Button variant="ghost" size="sm" onClick={insertTable}>
              <TableIcon className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="h-6" />

            {/* Actions */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
            >
              <Redo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
            >
              <RemoveFormatting className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
      
      {/* Editor Content */}
      {markdownMode ? (
        <div className="min-h-[400px]">
          <textarea
            value={markdownContent}
            onChange={(e) => handleMarkdownChange(e.target.value)}
            placeholder={placeholder || "Write in Markdown..."}
            className="w-full min-h-[400px] p-4 bg-transparent text-foreground font-mono text-sm resize-none focus:outline-none"
          />
        </div>
      ) : (
        <EditorContent 
          editor={editor} 
          placeholder={placeholder}
          className="min-h-[400px]"
        />
      )}

      {/* Image Upload Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Image Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="image-alt">Alt Text (for accessibility)</Label>
              <Input
                id="image-alt"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="Describe the image..."
              />
            </div>
            <div>
              <Label htmlFor="image-caption">Caption (optional)</Label>
              <Input
                id="image-caption"
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
                placeholder="Add a caption for your image..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowImageDialog(false);
              setImageCaption('');
              setImageAlt('');
              setUploadedImageUrl(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleInsertImage}>
              Insert Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Code Block Dialog */}
      <Dialog open={showCodeBlockDialog} onOpenChange={setShowCodeBlockDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Insert Code Block</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="code-language">Programming Language</Label>
              <select
                id="code-language"
                value={codeLanguage}
                onChange={(e) => setCodeLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="c">C</option>
                <option value="csharp">C#</option>
                <option value="php">PHP</option>
                <option value="ruby">Ruby</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
                <option value="swift">Swift</option>
                <option value="kotlin">Kotlin</option>
                <option value="solidity">Solidity</option>
                <option value="sql">SQL</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="json">JSON</option>
                <option value="yaml">YAML</option>
                <option value="markdown">Markdown</option>
                <option value="bash">Bash</option>
                <option value="shell">Shell</option>
              </select>
            </div>
            <div>
              <Label>Code Editor</Label>
              <Textarea
                value={codeContent}
                onChange={(e) => setCodeContent(e.target.value)}
                placeholder="Paste or write your code here..."
                className="min-h-[400px] font-mono text-sm resize-none"
                spellCheck={false}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCodeBlockDialog(false);
              setCodeContent('');
              setCodeLanguage('javascript');
            }}>
              Cancel
            </Button>
            <Button onClick={handleInsertCodeBlock}>
              Insert Code Block
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
}