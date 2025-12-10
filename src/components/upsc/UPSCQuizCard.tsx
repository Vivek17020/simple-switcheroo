import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, BookOpen, Target, Trophy, Users } from 'lucide-react';
import { Quiz } from '@/hooks/use-upsc-quizzes';
import { cn } from '@/lib/utils';

interface UPSCQuizCardProps {
  quiz: Quiz;
}

export const UPSCQuizCard = ({ quiz }: UPSCQuizCardProps) => {
  const difficultyColors = {
    easy: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    hard: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            {quiz.is_daily_quiz && (
              <Badge className="bg-primary text-primary-foreground mb-2">
                <Trophy className="h-3 w-3 mr-1" />
                Daily Quiz
              </Badge>
            )}
            <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
              {quiz.title}
            </h3>
          </div>
          <Badge className={cn("flex-shrink-0", difficultyColors[quiz.difficulty])}>
            {quiz.difficulty}
          </Badge>
        </div>

        {/* Description */}
        {quiz.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {quiz.description}
          </p>
        )}

        {/* Meta Info */}
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span>{quiz.questions.length} Questions</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{quiz.duration_minutes} mins</span>
          </div>
          <div className="flex items-center gap-1">
            <Target className="h-4 w-4" />
            <span>{quiz.total_marks} marks</span>
          </div>
        </div>

        {/* Subject & Category */}
        <div className="flex flex-wrap gap-2">
          {quiz.subject && (
            <Badge variant="secondary" className="text-xs">
              {quiz.subject}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            {quiz.category}
          </Badge>
        </div>

        {/* Stats */}
        {quiz.attempt_count > 0 && (
          <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{quiz.attempt_count} attempts</span>
            </div>
            <div className="flex items-center gap-1">
              <Trophy className="h-4 w-4" />
              <span>Avg: {quiz.avg_score.toFixed(0)}%</span>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-5 pt-0">
        <Link to={`/upsc-briefs/quiz/${quiz.id}`} className="w-full">
          <Button className="w-full group-hover:bg-primary/90">
            Start Quiz
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};
