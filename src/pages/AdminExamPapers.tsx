import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, ArrowLeft, Upload } from "lucide-react";
import { toast } from "sonner";

export default function AdminExamPapers() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPaper, setEditingPaper] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    exam_title: "",
    year: new Date().getFullYear(),
    tier: "",
    file_url: "",
  });

  const queryClient = useQueryClient();

  const { data: papers, isLoading } = useQuery({
    queryKey: ["exam-papers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_papers")
        .select(`
          *,
          exam_list (
            exam_name,
            category
          )
        `)
        .order("year", { ascending: false })
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("exam_papers").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam-papers"] });
      toast.success("Paper uploaded successfully");
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to upload paper: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("exam_papers")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam-papers"] });
      toast.success("Paper updated successfully");
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to update paper: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exam_papers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam-papers"] });
      toast.success("Paper deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete paper: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      exam_title: "",
      year: new Date().getFullYear(),
      tier: "",
      file_url: "",
    });
    setEditingPaper(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingPaper) {
      updateMutation.mutate({ id: editingPaper.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (paper: any) => {
    setEditingPaper(paper);
    setFormData({
      exam_title: paper.exam_title || "",
      year: paper.year,
      tier: paper.tier || "",
      file_url: paper.file_url,
    });
    setIsDialogOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return;
    }

    setUploading(true);
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from("exam-papers")
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("exam-papers")
        .getPublicUrl(fileName);

      setFormData({
        ...formData,
        file_url: publicUrl,
      });

      toast.success("File uploaded successfully");
    } catch (error: any) {
      toast.error("Failed to upload file: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Previous Year Papers</h1>
          <p className="text-muted-foreground mt-1">
            Upload and manage question papers
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Upload Paper
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPaper ? "Edit Paper" : "Upload New Paper"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="exam_title">Title of Exam *</Label>
                <Input
                  id="exam_title"
                  value={formData.exam_title}
                  onChange={(e) => setFormData({ ...formData, exam_title: e.target.value })}
                  placeholder="e.g., SSC CGL 2024 Tier 1, NDA 2023 Paper 2"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="year">Year *</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    min="2000"
                    max={new Date().getFullYear()}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="tier">Tier/Level</Label>
                  <Input
                    id="tier"
                    value={formData.tier}
                    onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                    placeholder="e.g., Tier 1, Prelims"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="file">PDF File *</Label>
                <div className="flex gap-2">
                  <Input
                    id="file"
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  {uploading && <Upload className="h-5 w-5 animate-spin" />}
                </div>
                {formData.file_url && (
                  <p className="text-sm text-muted-foreground mt-1">
                    File uploaded successfully
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={!formData.file_url || uploading}
                >
                  {editingPaper ? "Update" : "Upload"} Paper
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded" />
          ))}
        </div>
      ) : papers && papers.length > 0 ? (
        <div className="bg-card rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-center">Year</TableHead>
                <TableHead>Tier/Level</TableHead>
                <TableHead className="text-center">Downloads</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {papers.map((paper) => (
                <TableRow key={paper.id}>
                  <TableCell className="font-medium">{paper.exam_title || paper.exam_list?.exam_name || "Unknown"}</TableCell>
                  <TableCell>{paper.exam_list?.category || "—"}</TableCell>
                  <TableCell className="text-center">{paper.year}</TableCell>
                  <TableCell>{paper.tier || "—"}</TableCell>
                  <TableCell className="text-center">{paper.download_count || 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                      >
                        <a href={paper.file_url} target="_blank" rel="noopener noreferrer">
                          View PDF
                        </a>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(paper)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this paper?")) {
                            deleteMutation.mutate(paper.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <Upload className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">No papers yet</h3>
          <p className="text-muted-foreground mb-4">Upload your first question paper</p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Upload Paper
          </Button>
        </div>
      )}
    </div>
  );
}
