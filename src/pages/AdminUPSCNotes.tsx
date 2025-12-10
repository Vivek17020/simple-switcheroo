import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Download, Upload, FileText, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { 
  useAllNotes, 
  useCreateNote, 
  useUpdateNote, 
  useDeleteNote,
  type Note 
} from "@/hooks/use-upsc-notes";

const SUBJECTS = [
  "History", "Geography", "Polity", "Economy", "Environment", 
  "Science & Technology", "Current Affairs", "Ethics", "Art & Culture",
  "NCERT Notes", "Previous Year Analysis"
];

const AdminUPSCNotes = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    topic: "",
    file_url: "",
    file_size: 0,
    is_published: false,
  });

  const { data: notes, isLoading } = useAllNotes();
  const createMutation = useCreateNote();
  const updateMutation = useUpdateNote();
  const deleteMutation = useDeleteNote();

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      subject: "",
      topic: "",
      file_url: "",
      file_size: 0,
      is_published: false,
    });
    setEditingNote(null);
    setIsDialogOpen(false);
  };

  const openEditDialog = (note: Note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      description: note.description || "",
      subject: note.subject,
      topic: note.topic || "",
      file_url: note.file_url,
      file_size: note.file_size || 0,
      is_published: note.is_published,
    });
    setIsDialogOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes("pdf")) {
      toast.error("Only PDF files are allowed");
      return;
    }

    setUploading(true);
    try {
      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      const { data, error } = await supabase.storage
        .from("exam-papers")
        .upload(`upsc-notes/${fileName}`, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("exam-papers")
        .getPublicUrl(data.path);

      setFormData({
        ...formData,
        file_url: urlData.publicUrl,
        file_size: file.size,
        title: formData.title || file.name.replace(".pdf", "").replace(/-/g, " "),
      });
      toast.success("File uploaded successfully");
    } catch (error: any) {
      toast.error("Upload failed: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file_url) {
      toast.error("Please upload a PDF file");
      return;
    }
    try {
      if (editingNote) {
        await updateMutation.mutateAsync({ id: editingNote.id, ...formData });
        toast.success("Note updated");
      } else {
        await createMutation.mutateAsync(formData);
        toast.success("Note created");
      }
      resetForm();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">UPSC Notes</h1>
          <p className="text-muted-foreground">Upload and manage PDF study materials</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Upload Note</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingNote ? "Edit Note" : "Upload New Note"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>PDF File</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                {formData.file_url ? (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <FileText className="h-8 w-8 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium line-clamp-1">{formData.title || "Uploaded file"}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(formData.file_size)}</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                      Replace
                    </Button>
                  </div>
                ) : (
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full h-24 border-dashed"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="h-6 w-6 mr-2" />
                    {uploading ? "Uploading..." : "Click to upload PDF"}
                  </Button>
                )}
              </div>
              <div>
                <Label>Title</Label>
                <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required placeholder="e.g., Modern History - Freedom Struggle Notes" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description of the notes content..." rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Subject</Label>
                  <Select value={formData.subject} onValueChange={(v) => setFormData({ ...formData, subject: v })}>
                    <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Topic (optional)</Label>
                  <Input value={formData.topic} onChange={(e) => setFormData({ ...formData, topic: e.target.value })} placeholder="e.g., Freedom Struggle" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={formData.is_published} onCheckedChange={(v) => setFormData({ ...formData, is_published: v })} />
                <Label>Published (visible to users)</Label>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending || uploading}>
                  {editingNote ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Card key={i} className="h-48 animate-pulse bg-muted" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes?.map((note) => (
            <Card key={note.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <FileText className="h-10 w-10 text-primary flex-shrink-0" />
                    <div>
                      <CardTitle className="text-base line-clamp-2">{note.title}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">{formatFileSize(note.file_size)}</p>
                    </div>
                  </div>
                  <Badge variant={note.is_published ? "default" : "secondary"}>
                    {note.is_published ? "Published" : "Draft"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {note.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{note.description}</p>
                )}
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">{note.subject}</Badge>
                  {note.topic && <Badge variant="outline" className="text-xs">{note.topic}</Badge>}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Download className="h-3 w-3" />
                  <span>{note.download_count} downloads</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => openEditDialog(note)}>
                    <Pencil className="h-4 w-4 mr-1" />Edit
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href={note.file_url} target="_blank" rel="noopener noreferrer">
                      <Eye className="h-4 w-4 mr-1" />View
                    </a>
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => {
                      if (confirm("Delete this note?")) {
                        deleteMutation.mutate(note.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminUPSCNotes;
