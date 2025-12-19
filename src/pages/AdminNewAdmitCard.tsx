import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import slugify from "slugify";

export default function AdminNewAdmitCard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    exam_name: "",
    download_link: "",
    published_date: "",
    content: "",
    featured: false,
    published: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const slug = slugify(formData.title, { lower: true, strict: true });

      const { error } = await supabase
        .from("admit_cards")
        .insert({
          ...formData,
          slug,
          author_id: user.id,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Admit card created successfully",
      });
      navigate("/admin/admit-cards");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create admit card",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/admit-cards">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">New Admit Card</h1>
          <p className="text-muted-foreground">Create a new admit card announcement</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Admit Card Details</CardTitle>
            <CardDescription>Fill in the admit card information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., SSC CGL Admit Card 2025"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exam_name">Exam Name *</Label>
              <Input
                id="exam_name"
                value={formData.exam_name}
                onChange={(e) => setFormData({ ...formData, exam_name: e.target.value })}
                placeholder="e.g., SSC CGL"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="download_link">Download Link</Label>
              <Input
                id="download_link"
                type="url"
                value={formData.download_link}
                onChange={(e) => setFormData({ ...formData, download_link: e.target.value })}
                placeholder="https://example.com/admit-card"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="published_date">Published Date</Label>
              <Input
                id="published_date"
                type="date"
                value={formData.published_date}
                onChange={(e) => setFormData({ ...formData, published_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content (Optional)</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Additional information about the admit card..."
                rows={6}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="featured"
                checked={formData.featured}
                onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
              />
              <Label htmlFor="featured">Featured</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="published"
                checked={formData.published}
                onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
              />
              <Label htmlFor="published">Published</Label>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Admit Card"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link to="/admin/admit-cards">Cancel</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
