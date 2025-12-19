import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface CricketMatch {
  id: string;
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
}

const statusColorMap: Record<string, string> = {
  blue: "bg-blue-500",
  red: "bg-red-500",
  green: "bg-green-500",
  yellow: "bg-yellow-500",
};

export function CricketMatchesSection() {
  const { data: matches, isLoading } = useQuery({
    queryKey: ["cricket-matches-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cricket_matches")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data as CricketMatch[];
    },
  });

  if (isLoading) {
    return (
      <div className="py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">MATCHES</h2>
        </div>
        <div className="text-center py-12 text-muted-foreground">Loading matches...</div>
      </div>
    );
  }

  if (!matches || matches.length === 0) {
    return null;
  }

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">MATCHES</h2>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/category/sports/cricket">
            ALL <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {matches.map((match) => (
          <Card key={match.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="bg-muted/50 px-4 py-3 border-b">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground">
                  {match.match_stage}
                </span>
                {match.status_badge && (
                  <Badge 
                    className={`${statusColorMap[match.status_color || "blue"]} text-white text-xs`}
                  >
                    {match.status_badge}
                  </Badge>
                )}
              </div>
              <div className="text-sm font-medium">{match.tournament}</div>
            </div>

            <div className="p-4">
              {/* Team 1 */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {match.team1_flag_url && (
                    <img 
                      src={match.team1_flag_url} 
                      alt={match.team1_name}
                      className="w-10 h-7 object-cover rounded border"
                    />
                  )}
                  <span className="font-medium">{match.team1_name}</span>
                </div>
                {match.team1_score && (
                  <span className="font-bold text-lg">{match.team1_score}</span>
                )}
              </div>

              {/* Team 2 */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {match.team2_flag_url && (
                    <img 
                      src={match.team2_flag_url} 
                      alt={match.team2_name}
                      className="w-10 h-7 object-cover rounded border"
                    />
                  )}
                  <span className="font-medium">{match.team2_name}</span>
                </div>
                {match.team2_score && (
                  <span className="font-bold text-lg">{match.team2_score}</span>
                )}
              </div>

              {/* Match Result */}
              {match.match_result && (
                <div className="text-sm text-primary font-medium mb-2 py-2 border-t">
                  {match.match_result}
                </div>
              )}

              {/* Match Time */}
              {match.match_time && (
                <div className="text-sm text-muted-foreground mb-3">
                  {match.match_time}
                </div>
              )}

              {/* Links */}
              {(match.schedule_link || match.points_table_link) && (
                <div className="flex gap-2 pt-2 border-t">
                  {match.points_table_link && (
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link to={match.points_table_link}>POINTS TABLE</Link>
                    </Button>
                  )}
                  {match.schedule_link && (
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link to={match.schedule_link}>SCHEDULE</Link>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}