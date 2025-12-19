import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { Plus, Pencil, Trash2, Eye, BookOpen, Clock, Target } from "lucide-react";
import type { Quiz, QuizQuestion } from "@/hooks/use-upsc-quizzes";

const SUBJECTS = [
  "History", "Geography", "Polity", "Economy", "Environment", 
  "Science & Technology", "Current Affairs", "Ethics", "General Studies"
];

const AdminUPSCQuizzes = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "prelims",
    subject: "",
    difficulty: "medium" as "easy" | "medium" | "hard",
    duration_minutes: 30,
    total_marks: 100,
    negative_marking: 0.33,
    is_published: false,
    is_daily_quiz: false,
    questions: [] as QuizQuestion[],
  });

  const { data: quizzes, isLoading } = useQuery({
    queryKey: ["upsc-quizzes-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("upsc_quizzes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data.map(q => ({
        ...q,
        questions: q.questions as unknown as QuizQuestion[]
      })) as Quiz[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("upsc_quizzes").insert([{
        ...data,
        questions: JSON.parse(JSON.stringify(data.questions)),
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upsc-quizzes-admin"] });
      toast.success("Quiz created successfully");
      resetForm();
    },
    onError: (error) => toast.error("Failed to create quiz: " + error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: typeof formData & { id: string }) => {
      const { error } = await supabase
        .from("upsc_quizzes")
        .update({
          ...data,
          questions: JSON.parse(JSON.stringify(data.questions)),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upsc-quizzes-admin"] });
      toast.success("Quiz updated successfully");
      resetForm();
    },
    onError: (error) => toast.error("Failed to update quiz: " + error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("upsc_quizzes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upsc-quizzes-admin"] });
      toast.success("Quiz deleted");
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "prelims",
      subject: "",
      difficulty: "medium",
      duration_minutes: 30,
      total_marks: 100,
      negative_marking: 0.33,
      is_published: false,
      is_daily_quiz: false,
      questions: [],
    });
    setEditingQuiz(null);
    setIsDialogOpen(false);
  };

  const openEditDialog = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setFormData({
      title: quiz.title,
      description: quiz.description || "",
      category: quiz.category,
      subject: quiz.subject || "",
      difficulty: quiz.difficulty,
      duration_minutes: quiz.duration_minutes,
      total_marks: quiz.total_marks,
      negative_marking: quiz.negative_marking,
      is_published: quiz.is_published,
      is_daily_quiz: quiz.is_daily_quiz,
      questions: quiz.questions,
    });
    setIsDialogOpen(true);
  };

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        {
          id: crypto.randomUUID(),
          question: "",
          options: ["", "", "", ""],
          correct_answer: 0,
          explanation: "",
          topic: "",
        },
      ],
    });
  };

  const updateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    const updated = [...formData.questions];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, questions: updated });
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...formData.questions];
    updated[qIndex].options[oIndex] = value;
    setFormData({ ...formData, questions: updated });
  };

  const removeQuestion = (index: number) => {
    setFormData({
      ...formData,
      questions: formData.questions.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.questions.length === 0) {
      toast.error("Add at least one question");
      return;
    }
    if (editingQuiz) {
      updateMutation.mutate({ id: editingQuiz.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">UPSC Quizzes</h1>
          <p className="text-muted-foreground">Manage quiz content for UPSC preparation</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New Quiz</Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingQuiz ? "Edit Quiz" : "Create New Quiz"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Title</Label>
                  <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                </div>
                <div className="col-span-2">
                  <Label>Description</Label>
                  <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prelims">Prelims</SelectItem>
                      <SelectItem value="mains">Mains</SelectItem>
                      <SelectItem value="current-affairs">Current Affairs</SelectItem>
                      <SelectItem value="optional">Optional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                  <Label>Difficulty</Label>
                  <Select value={formData.difficulty} onValueChange={(v: any) => setFormData({ ...formData, difficulty: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Duration (minutes)</Label>
                  <Input type="number" value={formData.duration_minutes} onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })} />
                </div>
                <div>
                  <Label>Total Marks</Label>
                  <Input type="number" value={formData.total_marks} onChange={(e) => setFormData({ ...formData, total_marks: parseInt(e.target.value) })} />
                </div>
                <div>
                  <Label>Negative Marking</Label>
                  <Input type="number" step="0.01" value={formData.negative_marking} onChange={(e) => setFormData({ ...formData, negative_marking: parseFloat(e.target.value) })} />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch checked={formData.is_published} onCheckedChange={(v) => setFormData({ ...formData, is_published: v })} />
                    <Label>Published</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={formData.is_daily_quiz} onCheckedChange={(v) => setFormData({ ...formData, is_daily_quiz: v })} />
                    <Label>Daily Quiz</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Questions ({formData.questions.length})</h3>
                  <Button type="button" variant="outline" onClick={addQuestion}><Plus className="h-4 w-4 mr-2" />Add Question</Button>
                </div>
                {formData.questions.map((q, qIndex) => (
                  <Card key={q.id} className="relative">
                    <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => removeQuestion(qIndex)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    <CardContent className="pt-6 space-y-4">
                      <div>
                        <Label>Question {qIndex + 1}</Label>
                        <Textarea value={q.question} onChange={(e) => updateQuestion(qIndex, "question", e.target.value)} required />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {q.options.map((opt, oIndex) => (
                          <div key={oIndex} className="flex items-center gap-2">
                            <input type="radio" name={`correct-${qIndex}`} checked={q.correct_answer === oIndex} onChange={() => updateQuestion(qIndex, "correct_answer", oIndex)} />
                            <Input value={opt} onChange={(e) => updateOption(qIndex, oIndex, e.target.value)} placeholder={`Option ${oIndex + 1}`} required />
                          </div>
                        ))}
                      </div>
                      <div>
                        <Label>Explanation</Label>
                        <Textarea value={q.explanation} onChange={(e) => updateQuestion(qIndex, "explanation", e.target.value)} />
                      </div>
                      <div>
                        <Label>Topic</Label>
                        <Input value={q.topic} onChange={(e) => updateQuestion(qIndex, "topic", e.target.value)} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingQuiz ? "Update Quiz" : "Create Quiz"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Card key={i} className="h-48 animate-pulse bg-muted" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizzes?.map((quiz) => (
            <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg line-clamp-2">{quiz.title}</CardTitle>
                  <Badge variant={quiz.is_published ? "default" : "secondary"}>
                    {quiz.is_published ? "Published" : "Draft"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{quiz.category}</Badge>
                  {quiz.subject && <Badge variant="outline">{quiz.subject}</Badge>}
                  <Badge variant={quiz.difficulty === "easy" ? "secondary" : quiz.difficulty === "hard" ? "destructive" : "default"}>
                    {quiz.difficulty}
                  </Badge>
                  {quiz.is_daily_quiz && <Badge className="bg-yellow-500">Daily</Badge>}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" />{quiz.questions.length} Q</span>
                  <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{quiz.duration_minutes}m</span>
                  <span className="flex items-center gap-1"><Target className="h-4 w-4" />{quiz.total_marks}</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => openEditDialog(quiz)}>
                    <Pencil className="h-4 w-4 mr-1" />Edit
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href={`/upscbriefs/quiz/${quiz.id}`} target="_blank"><Eye className="h-4 w-4 mr-1" />Preview</a>
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(quiz.id)}>
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

export default AdminUPSCQuizzes;
