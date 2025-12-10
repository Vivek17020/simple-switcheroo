import { useState } from "react";
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
import { Plus, Pencil, Trash2, RotateCcw } from "lucide-react";
import { 
  useAllFlashcards, 
  useCreateFlashcard, 
  useUpdateFlashcard, 
  useDeleteFlashcard,
  type Flashcard 
} from "@/hooks/use-upsc-flashcards";

const SUBJECTS = [
  "History", "Geography", "Polity", "Economy", "Environment", 
  "Science & Technology", "Current Affairs", "Ethics", "Art & Culture"
];

const AdminUPSCFlashcards = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    title: "",
    front_content: "",
    back_content: "",
    subject: "",
    topic: "",
    difficulty: "medium" as "easy" | "medium" | "hard",
    is_published: false,
  });

  const { data: flashcards, isLoading } = useAllFlashcards();
  const createMutation = useCreateFlashcard();
  const updateMutation = useUpdateFlashcard();
  const deleteMutation = useDeleteFlashcard();

  const resetForm = () => {
    setFormData({
      title: "",
      front_content: "",
      back_content: "",
      subject: "",
      topic: "",
      difficulty: "medium",
      is_published: false,
    });
    setEditingCard(null);
    setIsDialogOpen(false);
  };

  const openEditDialog = (card: Flashcard) => {
    setEditingCard(card);
    setFormData({
      title: card.title,
      front_content: card.front_content,
      back_content: card.back_content,
      subject: card.subject,
      topic: card.topic || "",
      difficulty: card.difficulty,
      is_published: card.is_published,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCard) {
        await updateMutation.mutateAsync({ id: editingCard.id, ...formData });
        toast.success("Flashcard updated");
      } else {
        await createMutation.mutateAsync(formData);
        toast.success("Flashcard created");
      }
      resetForm();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const toggleFlip = (id: string) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">UPSC Flashcards</h1>
          <p className="text-muted-foreground">Create and manage flashcards for quick revision</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New Flashcard</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingCard ? "Edit Flashcard" : "Create New Flashcard"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required placeholder="e.g., Article 21 - Right to Life" />
              </div>
              <div>
                <Label>Front (Question/Term)</Label>
                <Textarea value={formData.front_content} onChange={(e) => setFormData({ ...formData, front_content: e.target.value })} required placeholder="What is Article 21?" rows={3} />
              </div>
              <div>
                <Label>Back (Answer/Definition)</Label>
                <Textarea value={formData.back_content} onChange={(e) => setFormData({ ...formData, back_content: e.target.value })} required placeholder="Article 21 guarantees protection of life and personal liberty..." rows={4} />
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
                  <Input value={formData.topic} onChange={(e) => setFormData({ ...formData, topic: e.target.value })} placeholder="Fundamental Rights" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                <div className="flex items-center gap-2 pt-6">
                  <Switch checked={formData.is_published} onCheckedChange={(v) => setFormData({ ...formData, is_published: v })} />
                  <Label>Published</Label>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingCard ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Card key={i} className="h-64 animate-pulse bg-muted" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {flashcards?.map((card) => (
            <Card 
              key={card.id} 
              className={`relative cursor-pointer transition-all duration-500 hover:shadow-lg ${flippedCards.has(card.id) ? 'bg-primary/5' : ''}`}
              style={{ minHeight: '240px' }}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base line-clamp-1 pr-8">{card.title}</CardTitle>
                  <Badge variant={card.is_published ? "default" : "secondary"} className="flex-shrink-0">
                    {card.is_published ? "Published" : "Draft"}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">{card.subject}</Badge>
                  {card.topic && <Badge variant="outline" className="text-xs">{card.topic}</Badge>}
                  <Badge variant={card.difficulty === "easy" ? "secondary" : card.difficulty === "hard" ? "destructive" : "default"} className="text-xs">
                    {card.difficulty}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div 
                  className="min-h-[80px] p-3 bg-muted rounded-lg cursor-pointer relative"
                  onClick={() => toggleFlip(card.id)}
                >
                  <div className="absolute top-2 right-2">
                    <RotateCcw className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm whitespace-pre-wrap">
                    {flippedCards.has(card.id) ? card.back_content : card.front_content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {flippedCards.has(card.id) ? "Answer" : "Question"} - Click to flip
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEditDialog(card)}>
                    <Pencil className="h-4 w-4 mr-1" />Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => {
                      if (confirm("Delete this flashcard?")) {
                        deleteMutation.mutate(card.id);
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

export default AdminUPSCFlashcards;
