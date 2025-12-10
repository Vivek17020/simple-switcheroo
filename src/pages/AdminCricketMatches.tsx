import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Trash2, Plus, Upload, Edit2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CricketMatch {
  id?: string;
  sport_type: string;
  tournament: string;
  match_stage: string;
  status_badge?: string;
  status_color?: string;
  team1_name: string;
  team1_flag_url?: string;
  team1_score?: string;
  team2_name: string;
  team2_flag_url?: string;
  team2_score?: string;
  match_time?: string;
  match_result?: string;
  schedule_link?: string;
  points_table_link?: string;
  display_order?: number;
  is_active?: boolean;
}

const SPORT_TYPES = [
  { value: 'cricket', label: 'Cricket' },
  { value: 'football', label: 'Football' },
  { value: 'tennis', label: 'Tennis' },
  { value: 'esports', label: 'Esports' },
  { value: 'olympic', label: 'Olympic' },
];

export default function AdminCricketMatches() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<CricketMatch | null>(null);
  const [formData, setFormData] = useState<CricketMatch>({
    sport_type: "cricket",
    tournament: "",
    match_stage: "",
    status_badge: "",
    status_color: "blue",
    team1_name: "",
    team1_flag_url: "",
    team1_score: "",
    team2_name: "",
    team2_flag_url: "",
    team2_score: "",
    match_time: "",
    match_result: "",
    schedule_link: "",
    points_table_link: "",
    display_order: 0,
    is_active: true,
  });

  const { data: matches, isLoading } = useQuery({
    queryKey: ["cricket-matches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cricket_matches")
        .select("*")
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data as CricketMatch[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (match: CricketMatch) => {
      if (match.id) {
        const { error } = await supabase
          .from("cricket_matches")
          .update(match)
          .eq("id", match.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cricket_matches")
          .insert([match]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cricket-matches"] });
      toast.success(editingMatch ? "Match updated successfully" : "Match created successfully");
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to save match: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("cricket_matches")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cricket-matches"] });
      toast.success("Match deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete match: " + error.message);
    },
  });

  const uploadFlag = async (file: File, team: "team1" | "team2") => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `flags/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("article-images")
      .upload(filePath, file);

    if (uploadError) {
      toast.error("Failed to upload flag");
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("article-images")
      .getPublicUrl(filePath);

    setFormData({
      ...formData,
      [`${team}_flag_url`]: publicUrl,
    });
    toast.success("Flag uploaded successfully");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const resetForm = () => {
    setFormData({
      sport_type: "cricket",
      tournament: "",
      match_stage: "",
      status_badge: "",
      status_color: "blue",
      team1_name: "",
      team1_flag_url: "",
      team1_score: "",
      team2_name: "",
      team2_flag_url: "",
      team2_score: "",
      match_time: "",
      match_result: "",
      schedule_link: "",
      points_table_link: "",
      display_order: 0,
      is_active: true,
    });
    setEditingMatch(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (match: CricketMatch) => {
    setEditingMatch(match);
    setFormData(match);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Sports Matches</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Match
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading matches...</div>
      ) : (
        <div className="grid gap-4">
          {matches?.map((match) => (
            <Card key={match.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{match.tournament}</span>
                    {match.status_badge && (
                      <span className={`px-2 py-1 rounded text-xs text-white bg-${match.status_color}-500`}>
                        {match.status_badge}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">{match.match_stage}</div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      {match.team1_flag_url && (
                        <img src={match.team1_flag_url} alt={match.team1_name} className="w-8 h-6 object-cover rounded" />
                      )}
                      <span>{match.team1_name}</span>
                      {match.team1_score && <span className="font-bold">{match.team1_score}</span>}
                    </div>
                    <span>vs</span>
                    <div className="flex items-center gap-2">
                      {match.team2_flag_url && (
                        <img src={match.team2_flag_url} alt={match.team2_name} className="w-8 h-6 object-cover rounded" />
                      )}
                      <span>{match.team2_name}</span>
                      {match.team2_score && <span className="font-bold">{match.team2_score}</span>}
                    </div>
                  </div>
                  {match.match_result && (
                    <div className="text-sm text-primary">{match.match_result}</div>
                  )}
                  {match.match_time && (
                    <div className="text-sm text-muted-foreground">{match.match_time}</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(match)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => match.id && deleteMutation.mutate(match.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMatch ? "Edit Match" : "Add New Match"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sport_type">Sport Type *</Label>
              <Select
                value={formData.sport_type}
                onValueChange={(value) => setFormData({ ...formData, sport_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPORT_TYPES.map((sport) => (
                    <SelectItem key={sport.value} value={sport.value}>
                      {sport.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tournament">Tournament *</Label>
                <Input
                  id="tournament"
                  value={formData.tournament}
                  onChange={(e) => setFormData({ ...formData, tournament: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="match_stage">Match Stage *</Label>
                <Input
                  id="match_stage"
                  value={formData.match_stage}
                  onChange={(e) => setFormData({ ...formData, match_stage: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status_badge">Status Badge</Label>
                <Input
                  id="status_badge"
                  value={formData.status_badge}
                  onChange={(e) => setFormData({ ...formData, status_badge: e.target.value })}
                  placeholder={
                    formData.sport_type === 'cricket' ? 'ODI, FC, T20' :
                    formData.sport_type === 'football' ? 'Premier League, Champions League' :
                    formData.sport_type === 'tennis' ? 'Grand Slam, ATP, WTA' :
                    formData.sport_type === 'esports' ? 'Valorant, CS:GO, Dota 2' :
                    'Summer, Winter'
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status_color">Badge Color</Label>
                <Select
                  value={formData.status_color}
                  onValueChange={(value) => setFormData({ ...formData, status_color: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="red">Red</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="yellow">Yellow</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4 border p-4 rounded">
              <h3 className="font-semibold">Team 1</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="team1_name">Team Name *</Label>
                  <Input
                    id="team1_name"
                    value={formData.team1_name}
                    onChange={(e) => setFormData({ ...formData, team1_name: e.target.value })}
                    required
                  />
                </div>
              <div className="space-y-2">
                <Label htmlFor="team1_score">Score</Label>
                <Input
                  id="team1_score"
                  value={formData.team1_score}
                  onChange={(e) => setFormData({ ...formData, team1_score: e.target.value })}
                  placeholder={
                    formData.sport_type === 'cricket' ? '136-2' :
                    formData.sport_type === 'football' ? '2' :
                    formData.sport_type === 'tennis' ? '6-4, 7-5' :
                    formData.sport_type === 'esports' ? '13' :
                    '9.85'
                  }
                />
              </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="team1_flag">Flag</Label>
                <div className="flex items-center gap-2">
                  {formData.team1_flag_url && (
                    <img src={formData.team1_flag_url} alt="Team 1 Flag" className="w-12 h-8 object-cover rounded" />
                  )}
                  <Input
                    id="team1_flag"
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && uploadFlag(e.target.files[0], "team1")}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 border p-4 rounded">
              <h3 className="font-semibold">Team 2</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="team2_name">Team Name *</Label>
                  <Input
                    id="team2_name"
                    value={formData.team2_name}
                    onChange={(e) => setFormData({ ...formData, team2_name: e.target.value })}
                    required
                  />
                </div>
              <div className="space-y-2">
                <Label htmlFor="team2_score">Score</Label>
                <Input
                  id="team2_score"
                  value={formData.team2_score}
                  onChange={(e) => setFormData({ ...formData, team2_score: e.target.value })}
                  placeholder={
                    formData.sport_type === 'cricket' ? '194 (42.3)' :
                    formData.sport_type === 'football' ? '3' :
                    formData.sport_type === 'tennis' ? '3-6, 6-7' :
                    formData.sport_type === 'esports' ? '11' :
                    '9.72'
                  }
                />
              </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="team2_flag">Flag</Label>
                <div className="flex items-center gap-2">
                  {formData.team2_flag_url && (
                    <img src={formData.team2_flag_url} alt="Team 2 Flag" className="w-12 h-8 object-cover rounded" />
                  )}
                  <Input
                    id="team2_flag"
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && uploadFlag(e.target.files[0], "team2")}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="match_time">Match Time</Label>
              <Input
                id="match_time"
                value={formData.match_time}
                onChange={(e) => setFormData({ ...formData, match_time: e.target.value })}
                placeholder="Today • 3:00 PM"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="match_result">Match Result</Label>
              <Textarea
                id="match_result"
                value={formData.match_result}
                onChange={(e) => setFormData({ ...formData, match_result: e.target.value })}
                placeholder={
                  formData.sport_type === 'cricket' ? 'South Africa Women won by 125 runs' :
                  formData.sport_type === 'football' ? 'Manchester United won 3-2' :
                  formData.sport_type === 'tennis' ? 'Djokovic won in straight sets' :
                  formData.sport_type === 'esports' ? 'Team Liquid won 13-11' :
                  'USA won Gold Medal'
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="schedule_link">Schedule Link</Label>
                <Input
                  id="schedule_link"
                  value={formData.schedule_link}
                  onChange={(e) => setFormData({ ...formData, schedule_link: e.target.value })}
                  placeholder="/schedule"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="points_table_link">Points Table Link</Label>
                <Input
                  id="points_table_link"
                  value={formData.points_table_link}
                  onChange={(e) => setFormData({ ...formData, points_table_link: e.target.value })}
                  placeholder="/points-table"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : "Save Match"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}