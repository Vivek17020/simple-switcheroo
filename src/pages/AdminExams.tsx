import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

export default function AdminExams() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    exam_name: "",
    category: "",
    short_description: "",
    logo_url: "",
  });

  const queryClient = useQueryClient();

  const { data: exams, isLoading } = useQuery({
    queryKey: ["exam-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_list")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData & { slug: string }) => {
      const { error } = await supabase.from("exam_list").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam-list"] });
      toast.success("Exam created successfully");
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to create exam: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData & { slug: string } }) => {
      const { error } = await supabase
        .from("exam_list")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam-list"] });
      toast.success("Exam updated successfully");
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to update exam: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exam_list").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam-list"] });
      toast.success("Exam deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete exam: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      exam_name: "",
      category: "",
      short_description: "",
      logo_url: "",
    });
    setEditingExam(null);
    setIsDialogOpen(false);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = generateSlug(formData.exam_name);
    
    if (editingExam) {
      updateMutation.mutate({ id: editingExam.id, data: { ...formData, slug } });
    } else {
      createMutation.mutate({ ...formData, slug });
    }
  };

  const handleEdit = (exam: any) => {
    setEditingExam(exam);
    setFormData({
      exam_name: exam.exam_name,
      category: exam.category,
      short_description: exam.short_description || "",
      logo_url: exam.logo_url || "",
    });
    setIsDialogOpen(true);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
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
        logo_url: publicUrl,
      });

      toast.success("Logo uploaded successfully");
    } catch (error: any) {
      toast.error("Failed to upload logo: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Exams</h1>
          <p className="text-muted-foreground mt-1">
            Add and manage government exams
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Exam
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingExam ? "Edit Exam" : "Add New Exam"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="exam_name">Exam Name *</Label>
                <Input
                  id="exam_name"
                  value={formData.exam_name}
                  onChange={(e) => setFormData({ ...formData, exam_name: e.target.value })}
                  placeholder="e.g., SSC CGL"
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., SSC, Railway, Banking, Defence"
                  required
                />
              </div>

              <div>
                <Label htmlFor="short_description">Short Description</Label>
                <Textarea
                  id="short_description"
                  value={formData.short_description}
                  onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                  placeholder="Brief description of the exam"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="logo">Exam Logo (Optional)</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploading}
                  />
                  {uploading && <Upload className="h-5 w-5 animate-spin" />}
                </div>
                {formData.logo_url && (
                  <div className="mt-2 flex items-center gap-2">
                    <img src={formData.logo_url} alt="Logo preview" className="h-16 w-16 object-contain rounded border" />
                    <p className="text-sm text-muted-foreground">Logo uploaded</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={uploading}
                >
                  {editingExam ? "Update" : "Create"} Exam
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
      ) : exams && exams.length > 0 ? (
        <div className="bg-card rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Logo</TableHead>
                <TableHead>Exam Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell>
                    {exam.logo_url ? (
                      <img src={exam.logo_url} alt={exam.exam_name} className="h-10 w-10 object-contain" />
                    ) : (
                      <ImageIcon className="h-10 w-10 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{exam.exam_name}</TableCell>
                  <TableCell>{exam.category}</TableCell>
                  <TableCell className="max-w-md truncate">{exam.short_description || "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(exam)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm("Are you sure? This will also delete all papers for this exam.")) {
                            deleteMutation.mutate(exam.id);
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
          <ImageIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">No exams yet</h3>
          <p className="text-muted-foreground mb-4">Add your first exam</p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Exam
          </Button>
        </div>
      )}
    </div>
  );
}
