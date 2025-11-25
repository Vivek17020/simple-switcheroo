import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Trash2, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function AdminAdmitCards() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: admitCards, isLoading, refetch } = useQuery({
    queryKey: ["admin-admit-cards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admit_cards")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this admit card?")) return;

    const { error } = await supabase
      .from("admit_cards")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete admit card",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Admit card deleted successfully",
      });
      refetch();
    }
  };

  const filteredCards = admitCards?.filter((card) =>
    card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    card.exam_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admit Cards</h1>
          <p className="text-muted-foreground">Manage admit card announcements</p>
        </div>
        <Button asChild>
          <Link to="/admin/admit-cards/new">
            <Plus className="mr-2 h-4 w-4" />
            Add New Admit Card
          </Link>
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search admit cards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button asChild variant="outline">
          <Link to="/admin/admit-cards/content-sections">
            Manage Content Sections
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/2 mb-2" />
                <div className="h-4 bg-muted rounded w-1/4" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredCards && filteredCards.length > 0 ? (
            filteredCards.map((card) => (
              <Card key={card.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{card.title}</CardTitle>
                      <CardDescription className="space-y-1 mt-2">
                        <p>Exam: {card.exam_name}</p>
                        {card.published_date && (
                          <p>Published: {format(new Date(card.published_date), "MMM d, yyyy")}</p>
                        )}
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            card.published ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          }`}>
                            {card.published ? 'Published' : 'Draft'}
                          </span>
                          {card.featured && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              Featured
                            </span>
                          )}
                        </div>
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {card.download_link && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={card.download_link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/admin/admit-cards/${card.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(card.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  {searchQuery ? "No admit cards found matching your search" : "No admit cards yet. Create your first one!"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
