import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Circle,
  LayoutGrid,
  List,
  Trophy,
  Target,
  Clock
} from 'lucide-react';
import { UPSCPYQQuestionCard } from './UPSCPYQQuestionCard';
import { usePYQQuestions, usePYQAttempts, useSubmitPYQAttempt } from '@/hooks/use-upsc-pyq';
import type { PYQQuestion } from '@/hooks/use-upsc-pyq';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

interface UPSCPYQPlayerProps {
  articleId?: string;
  examName?: string;
  year?: number;
  subject?: string;
  title?: string;
}

export function UPSCPYQPlayer({ articleId, examName, year, subject, title }: UPSCPYQPlayerProps) {
  const { user } = useAuth();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'single' | 'all'>('single');

  const { data: questions = [], isLoading } = usePYQQuestions({
    articleId,
    examName,
    year,
    subject,
    isPublished: true,
  });

  const questionIds = useMemo(() => questions.map(q => q.id), [questions]);
  const { data: attempts = [] } = usePYQAttempts(questionIds);
  const submitAttempt = useSubmitPYQAttempt();

  // Group questions by section
  const sections = useMemo(() => {
    const grouped: { [key: string]: PYQQuestion[] } = {};
    questions.forEach(q => {
      const section = q.section_title || 'General';
      if (!grouped[section]) grouped[section] = [];
      grouped[section].push(q);
    });
    return grouped;
  }, [questions]);

  const sectionNames = Object.keys(sections);

  // Calculate stats
  const stats = useMemo(() => {
    const attempted = attempts.length;
    const correct = attempts.filter(a => a.is_correct).length;
    const wrong = attempted - correct;
    const total = questions.length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    return { attempted, correct, wrong, total, percentage };
  }, [attempts, questions]);

  const handleSubmitAnswer = async (questionId: string, answer: string, isCorrect: boolean) => {
    if (!user) {
      toast.error('Please login to save your progress');
      return;
    }

    try {
      await submitAttempt.mutateAsync({
        questionId,
        selectedAnswer: answer,
        isCorrect,
        timeSpentSeconds: 0,
      });
    } catch (error) {
      console.error('Failed to save attempt:', error);
    }
  };

  const getAttemptForQuestion = (questionId: string) => {
    return attempts.find(a => a.question_id === questionId);
  };

  const getQuestionStatus = (questionId: string) => {
    const attempt = getAttemptForQuestion(questionId);
    if (!attempt) return 'unattempted';
    return attempt.is_correct ? 'correct' : 'wrong';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <p className="text-muted-foreground">No questions available for this paper.</p>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl md:text-2xl">
                {title || `${examName || 'UPSC'} ${year || ''} Practice`}
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                {stats.total} Questions • {subject || 'All Subjects'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'single' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('single')}
                >
                  <List className="w-4 h-4 mr-1" />
                  Single
                </Button>
                <Button
                  variant={viewMode === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('all')}
                >
                  <LayoutGrid className="w-4 h-4 mr-1" />
                  All
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-background/80">
              <Target className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="font-bold">{stats.total}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-background/80">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Correct</p>
                <p className="font-bold text-green-600">{stats.correct}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-background/80">
              <XCircle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-xs text-muted-foreground">Wrong</p>
                <p className="font-bold text-red-600">{stats.wrong}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-background/80">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-xs text-muted-foreground">Score</p>
                <p className="font-bold text-yellow-600">{stats.percentage}%</p>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progress</span>
              <span>{stats.attempted} / {stats.total} attempted</span>
            </div>
            <Progress value={(stats.attempted / stats.total) * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Question Palette (Desktop) */}
        <div className="hidden lg:block">
          <Card className="sticky top-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Question Palette</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {sectionNames.map((section, sectionIdx) => (
                  <div key={section} className="mb-4">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      {section}
                    </p>
                    <div className="grid grid-cols-5 gap-2">
                      {sections[section].map((q, idx) => {
                        const globalIdx = questions.findIndex(quest => quest.id === q.id);
                        const status = getQuestionStatus(q.id);
                        return (
                          <button
                            key={q.id}
                            onClick={() => {
                              setCurrentQuestionIndex(globalIdx);
                              setViewMode('single');
                            }}
                            className={cn(
                              'w-8 h-8 rounded-md text-xs font-medium transition-all',
                              globalIdx === currentQuestionIndex && 'ring-2 ring-primary',
                              status === 'correct' && 'bg-green-500 text-white',
                              status === 'wrong' && 'bg-red-500 text-white',
                              status === 'unattempted' && 'bg-muted text-muted-foreground hover:bg-muted/80'
                            )}
                          >
                            {globalIdx + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </ScrollArea>

              {/* Legend */}
              <div className="mt-4 pt-4 border-t space-y-2">
                <p className="text-xs font-medium">Legend</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded bg-green-500"></div>
                    <span>Correct</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded bg-red-500"></div>
                    <span>Wrong</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded bg-muted"></div>
                    <span>Not Attempted</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Questions Area */}
        <div className="lg:col-span-3">
          {viewMode === 'single' ? (
            <div className="space-y-4">
              <UPSCPYQQuestionCard
                question={currentQuestion}
                questionIndex={currentQuestionIndex}
                existingAttempt={getAttemptForQuestion(currentQuestion.id)}
                onSubmitAnswer={handleSubmitAnswer}
              />

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                  disabled={currentQuestionIndex === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentQuestionIndex + 1} of {questions.length}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                  disabled={currentQuestionIndex === questions.length - 1}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          ) : (
            <Tabs defaultValue={sectionNames[0]} className="w-full">
              <TabsList className="w-full flex-wrap h-auto p-1 mb-4">
                {sectionNames.map(section => (
                  <TabsTrigger key={section} value={section} className="text-xs">
                    {section}
                  </TabsTrigger>
                ))}
              </TabsList>
              {sectionNames.map(section => (
                <TabsContent key={section} value={section} className="space-y-6">
                  {sections[section].map((q, idx) => {
                    const globalIdx = questions.findIndex(quest => quest.id === q.id);
                    return (
                      <UPSCPYQQuestionCard
                        key={q.id}
                        question={q}
                        questionIndex={globalIdx}
                        existingAttempt={getAttemptForQuestion(q.id)}
                        onSubmitAnswer={handleSubmitAnswer}
                      />
                    );
                  })}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
