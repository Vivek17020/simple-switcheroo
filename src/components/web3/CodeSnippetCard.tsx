import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code2, Eye, GitFork, Calendar } from "lucide-react";
import { CodeSnippet } from "@/hooks/use-code-snippets";
import { formatDistanceToNow } from "date-fns";

interface CodeSnippetCardProps {
  snippet: CodeSnippet;
  onView: (snippet: CodeSnippet) => void;
}

export const CodeSnippetCard = ({ snippet, onView }: CodeSnippetCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onView(snippet)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-lg truncate">
              <Code2 className="h-5 w-5 flex-shrink-0 text-primary" />
              <span className="truncate">{snippet.title}</span>
            </CardTitle>
            {snippet.description && (
              <CardDescription className="mt-2 line-clamp-2">
                {snippet.description}
              </CardDescription>
            )}
          </div>
          <Badge variant="secondary" className="flex-shrink-0">
            {snippet.language}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{snippet.view_count}</span>
            </div>
            <div className="flex items-center gap-1">
              <GitFork className="h-4 w-4" />
              <span>{snippet.fork_count}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{formatDistanceToNow(new Date(snippet.created_at), { addSuffix: true })}</span>
          </div>
        </div>
        <Button className="w-full mt-4" onClick={() => onView(snippet)}>
          View & Edit
        </Button>
      </CardContent>
    </Card>
  );
};
