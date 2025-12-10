import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Target, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MinusCircle,
  ArrowLeft,
  RotateCcw,
  Share2,
  BookOpen,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { Quiz, QuizQuestion, UserAnswer } from '@/hooks/use-upsc-quizzes';
import { cn } from '@/lib/utils';

interface QuizResultData {
  total_questions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  skipped: number;
  score: number;
  max_score: number;
  percentage: number;
  time_taken_seconds: number;
  answers: UserAnswer[];
}

interface UPSCQuizResultProps {
  quiz: Quiz;
  result: QuizResultData;
  onRetry?: () => void;
}

export const UPSCQuizResult = ({ quiz, result, onRetry }: UPSCQuizResultProps) => {
  const [showExplanations, setShowExplanations] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return { grade: 'A+', color: 'text-green-600', message: 'Outstanding!' };
    if (percentage >= 80) return { grade: 'A', color: 'text-green-500', message: 'Excellent!' };
    if (percentage >= 70) return { grade: 'B+', color: 'text-blue-600', message: 'Very Good!' };
    if (percentage >= 60) return { grade: 'B', color: 'text-blue-500', message: 'Good!' };
    if (percentage >= 50) return { grade: 'C', color: 'text-amber-500', message: 'Average' };
    if (percentage >= 40) return { grade: 'D', color: 'text-orange-500', message: 'Needs Improvement' };
    return { grade: 'F', color: 'text-red-500', message: 'Keep Practicing!' };
  };

  const gradeInfo = getGrade(result.percentage);

  // Group questions by topic for analysis
  const topicAnalysis = quiz.questions.reduce((acc, q) => {
    const answer = result.answers.find(a => a.question_id === q.id);
    if (!acc[q.topic]) {
      acc[q.topic] = { total: 0, correct: 0, incorrect: 0, skipped: 0 };
    }
    acc[q.topic].total++;
    if (answer?.selected_option === null || answer?.selected_option === undefined) {
      acc[q.topic].skipped++;
    } else if (answer?.is_correct) {
      acc[q.topic].correct++;
    } else {
      acc[q.topic].incorrect++;
    }
    return acc;
  }, {} as Record<string, { total: number; correct: number; incorrect: number; skipped: number }>);

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back Button */}
        <Link to="/upsc-briefs/practice" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Practice
        </Link>

        {/* Score Card */}
        <Card className="p-6 md:p-8 mb-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
              <Trophy className={cn("h-10 w-10", gradeInfo.color)} />
            </div>
            <h1 className="text-2xl font-bold mb-1">{gradeInfo.message}</h1>
            <p className="text-muted-foreground">{quiz.title}</p>
          </div>

          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="text-center">
              <div className={cn("text-5xl font-bold", gradeInfo.color)}>
                {result.percentage.toFixed(0)}%
              </div>
              <p className="text-sm text-muted-foreground">Score</p>
            </div>
            <div className="text-center">
              <div className={cn("text-4xl font-bold", gradeInfo.color)}>
                {gradeInfo.grade}
              </div>
              <p className="text-sm text-muted-foreground">Grade</p>
            </div>
          </div>

          <Progress 
            value={result.percentage} 
            className="h-3 mb-6" 
          />

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-background rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div className="text-2xl font-bold">{result.score.toFixed(1)}/{result.max_score}</div>
              <p className="text-xs text-muted-foreground">Total Score</p>
            </div>
            <div className="bg-background rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-green-600">{result.correct}</div>
              <p className="text-xs text-muted-foreground">Correct</p>
            </div>
            <div className="bg-background rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div className="text-2xl font-bold text-red-600">{result.incorrect}</div>
              <p className="text-xs text-muted-foreground">Incorrect</p>
            </div>
            <div className="bg-background rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{formatTime(result.time_taken_seconds || 0)}</div>
              <p className="text-xs text-muted-foreground">Time Taken</p>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mb-6">
          {onRetry && (
            <Button onClick={onRetry} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry Quiz
            </Button>
          )}
          <Button variant="outline">
            <Share2 className="h-4 w-4 mr-2" />
            Share Result
          </Button>
          <Link to="/upsc-briefs/practice">
            <Button>
              <BookOpen className="h-4 w-4 mr-2" />
              More Quizzes
            </Button>
          </Link>
        </div>

        {/* Detailed Analysis Tabs */}
        <Tabs defaultValue="analysis" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="analysis">Topic Analysis</TabsTrigger>
            <TabsTrigger value="review">Review Answers</TabsTrigger>
          </TabsList>

          <TabsContent value="analysis">
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance by Topic
              </h3>
              <div className="space-y-4">
                {Object.entries(topicAnalysis).map(([topic, stats]) => {
                  const accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
                  return (
                    <div key={topic} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{topic}</span>
                        <span className="text-sm text-muted-foreground">
                          {stats.correct}/{stats.total} correct
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={accuracy} className="h-2 flex-1" />
                        <span className={cn(
                          "text-sm font-medium w-12 text-right",
                          accuracy >= 70 ? "text-green-600" : accuracy >= 40 ? "text-amber-600" : "text-red-600"
                        )}>
                          {accuracy.toFixed(0)}%
                        </span>
                      </div>
                      {accuracy < 50 && (
                        <p className="text-xs text-amber-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Focus area: Revise {topic} concepts
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="review">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Question Review</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowExplanations(!showExplanations)}
                >
                  {showExplanations ? 'Hide' : 'Show'} Explanations
                </Button>
              </div>
              <div className="space-y-6">
                {quiz.questions.map((q, index) => {
                  const answer = result.answers.find(a => a.question_id === q.id);
                  const isCorrect = answer?.is_correct;
                  const isSkipped = answer?.selected_option === null || answer?.selected_option === undefined;

                  return (
                    <div 
                      key={q.id} 
                      className={cn(
                        "p-4 rounded-lg border-2",
                        isSkipped ? "border-muted bg-muted/20" :
                        isCorrect ? "border-green-200 bg-green-50 dark:bg-green-950/20" : 
                        "border-red-200 bg-red-50 dark:bg-red-950/20"
                      )}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <span className={cn(
                          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm",
                          isSkipped ? "bg-muted text-muted-foreground" :
                          isCorrect ? "bg-green-500 text-white" : "bg-red-500 text-white"
                        )}>
                          {isSkipped ? <MinusCircle className="h-4 w-4" /> :
                           isCorrect ? <CheckCircle2 className="h-4 w-4" /> : 
                           <XCircle className="h-4 w-4" />}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">Q{index + 1}</Badge>
                            <Badge variant="secondary" className="text-xs">{q.topic}</Badge>
                          </div>
                          <p className="font-medium">{q.question}</p>
                        </div>
                      </div>

                      <div className="ml-11 space-y-2">
                        {q.options.map((option, optIndex) => {
                          const isSelected = answer?.selected_option === optIndex;
                          const isCorrectOption = q.correct_answer === optIndex;

                          return (
                            <div
                              key={optIndex}
                              className={cn(
                                "flex items-center gap-2 p-2 rounded text-sm",
                                isCorrectOption && "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200",
                                isSelected && !isCorrectOption && "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
                              )}
                            >
                              <span className="font-medium w-6">
                                {String.fromCharCode(65 + optIndex)}.
                              </span>
                              <span className="flex-1">{option}</span>
                              {isCorrectOption && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                              {isSelected && !isCorrectOption && <XCircle className="h-4 w-4 text-red-600" />}
                            </div>
                          );
                        })}

                        {showExplanations && (
                          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-sm">
                            <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">Explanation:</p>
                            <p className="text-blue-700 dark:text-blue-300">{q.explanation}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
