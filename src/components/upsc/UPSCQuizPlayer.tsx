import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  RotateCcw,
  Send
} from 'lucide-react';
import { Quiz, QuizQuestion, UserAnswer, useSubmitQuizAttempt } from '@/hooks/use-upsc-quizzes';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UPSCQuizPlayerProps {
  quiz: Quiz;
  onComplete: (attemptId: string) => void;
}

export const UPSCQuizPlayer = ({ quiz, onComplete }: UPSCQuizPlayerProps) => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Map<string, number | null>>(new Map());
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(quiz.duration_minutes * 60);
  const [startTime] = useState(new Date().toISOString());
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [questionTimes, setQuestionTimes] = useState<Map<string, number>>(new Map());
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitAttempt = useSubmitQuizAttempt();
  const questions = quiz.questions;
  const question = questions[currentQuestion];

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Track time per question
  useEffect(() => {
    setQuestionStartTime(Date.now());
    return () => {
      const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
      setQuestionTimes(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(question.id) || 0;
        newMap.set(question.id, existing + timeSpent);
        return newMap;
      });
    };
  }, [currentQuestion]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (optionIndex: number) => {
    setAnswers(prev => {
      const newMap = new Map(prev);
      newMap.set(question.id, optionIndex);
      return newMap;
    });
  };

  const handleMarkForReview = () => {
    setMarkedForReview(prev => {
      const newSet = new Set(prev);
      if (newSet.has(question.id)) {
        newSet.delete(question.id);
      } else {
        newSet.add(question.id);
      }
      return newSet;
    });
  };

  const handleClearResponse = () => {
    setAnswers(prev => {
      const newMap = new Map(prev);
      newMap.delete(question.id);
      return newMap;
    });
  };

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestion(index);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setShowSubmitDialog(false);

    try {
      const completedAt = new Date().toISOString();
      const timeTaken = quiz.duration_minutes * 60 - timeLeft;

      let correct = 0;
      let incorrect = 0;
      let skipped = 0;

      const userAnswers: UserAnswer[] = questions.map(q => {
        const selected = answers.get(q.id);
        const isCorrect = selected === q.correct_answer;
        
        if (selected === undefined || selected === null) {
          skipped++;
        } else if (isCorrect) {
          correct++;
        } else {
          incorrect++;
        }

        return {
          question_id: q.id,
          selected_option: selected ?? null,
          is_correct: isCorrect,
          time_spent: questionTimes.get(q.id) || 0,
        };
      });

      const score = correct - (incorrect * quiz.negative_marking);
      const maxScore = questions.length;
      const percentage = (score / maxScore) * 100;

      const result = await submitAttempt.mutateAsync({
        quiz_id: quiz.id,
        user_id: null,
        started_at: startTime,
        completed_at: completedAt,
        time_taken_seconds: timeTaken,
        total_questions: questions.length,
        attempted: correct + incorrect,
        correct,
        incorrect,
        skipped,
        score: Math.max(0, score),
        max_score: maxScore,
        percentage: Math.max(0, percentage),
        answers: userAnswers,
        is_completed: true,
      });

      toast.success('Quiz submitted successfully!');
      onComplete(result.id);
    } catch (error) {
      console.error('Failed to submit quiz:', error);
      toast.error('Failed to submit quiz. Please try again.');
      setIsSubmitting(false);
    }
  };

  const getQuestionStatus = (q: QuizQuestion, index: number) => {
    const isAnswered = answers.has(q.id);
    const isMarked = markedForReview.has(q.id);
    const isCurrent = index === currentQuestion;

    if (isCurrent) return 'current';
    if (isMarked && isAnswered) return 'marked-answered';
    if (isMarked) return 'marked';
    if (isAnswered) return 'answered';
    return 'not-visited';
  };

  const answeredCount = answers.size;
  const markedCount = markedForReview.size;
  const notVisitedCount = questions.length - answeredCount;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-lg line-clamp-1">{quiz.title}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary">{quiz.subject}</Badge>
                <span>•</span>
                <span>{quiz.difficulty}</span>
              </div>
            </div>
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold",
              timeLeft <= 60 ? "bg-destructive/10 text-destructive animate-pulse" : "bg-primary/10 text-primary"
            )}>
              <Clock className="h-5 w-5" />
              {formatTime(timeLeft)}
            </div>
          </div>
          <Progress 
            value={(currentQuestion + 1) / questions.length * 100} 
            className="mt-2 h-1.5" 
          />
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-[1fr_280px] gap-6">
          {/* Question Area */}
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Badge variant="outline" className="text-sm">
                  Question {currentQuestion + 1} of {questions.length}
                </Badge>
                <Badge variant="secondary">{question.topic}</Badge>
              </div>

              <h2 className="text-xl font-medium mb-6 leading-relaxed">
                {question.question}
              </h2>

              <div className="space-y-3">
                {question.options.map((option, index) => {
                  const isSelected = answers.get(question.id) === index;
                  return (
                    <button
                      key={index}
                      onClick={() => handleSelectOption(index)}
                      className={cn(
                        "w-full text-left p-4 rounded-lg border-2 transition-all duration-200",
                        "hover:border-primary/50 hover:bg-primary/5",
                        isSelected 
                          ? "border-primary bg-primary/10 ring-2 ring-primary/20" 
                          : "border-border bg-card"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span className={cn(
                          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm",
                          isSelected 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted text-muted-foreground"
                        )}>
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span className="text-base pt-1">{option}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleClearResponse}
                  disabled={!answers.has(question.id)}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Clear
                </Button>
                <Button
                  variant={markedForReview.has(question.id) ? "default" : "outline"}
                  onClick={handleMarkForReview}
                >
                  <Flag className={cn("h-4 w-4 mr-2", markedForReview.has(question.id) && "fill-current")} />
                  {markedForReview.has(question.id) ? "Marked" : "Mark for Review"}
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => goToQuestion(currentQuestion - 1)}
                  disabled={currentQuestion === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                {currentQuestion < questions.length - 1 ? (
                  <Button onClick={() => goToQuestion(currentQuestion + 1)}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button 
                    onClick={() => setShowSubmitDialog(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Submit Quiz
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Question Navigator */}
          <div className="lg:sticky lg:top-24 h-fit">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Question Navigator</h3>
              
              <div className="grid grid-cols-5 gap-2 mb-4">
                {questions.map((q, index) => {
                  const status = getQuestionStatus(q, index);
                  return (
                    <button
                      key={q.id}
                      onClick={() => goToQuestion(index)}
                      className={cn(
                        "w-10 h-10 rounded-lg font-medium text-sm transition-all",
                        status === 'current' && "ring-2 ring-primary ring-offset-2",
                        status === 'answered' && "bg-green-500 text-white",
                        status === 'marked' && "bg-amber-500 text-white",
                        status === 'marked-answered' && "bg-purple-500 text-white",
                        status === 'not-visited' && "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="space-y-2 text-sm border-t pt-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-500" />
                  <span>Answered ({answeredCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-amber-500" />
                  <span>Marked for Review ({markedCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-purple-500" />
                  <span>Answered & Marked</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-muted" />
                  <span>Not Answered ({notVisitedCount})</span>
                </div>
              </div>

              <Button 
                className="w-full mt-4 bg-green-600 hover:bg-green-700"
                onClick={() => setShowSubmitDialog(true)}
              >
                <Send className="h-4 w-4 mr-2" />
                Submit Quiz
              </Button>
            </Card>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Quiz?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Are you sure you want to submit your quiz?</p>
                <div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total Questions:</span>
                    <strong>{questions.length}</strong>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Answered:</span>
                    <strong>{answeredCount}</strong>
                  </div>
                  <div className="flex justify-between text-amber-600">
                    <span>Marked for Review:</span>
                    <strong>{markedCount}</strong>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Unanswered:</span>
                    <strong>{questions.length - answeredCount}</strong>
                  </div>
                </div>
                {answeredCount < questions.length && (
                  <p className="text-amber-600 text-sm flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    You have unanswered questions!
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Review Answers</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? "Submitting..." : "Submit Quiz"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
