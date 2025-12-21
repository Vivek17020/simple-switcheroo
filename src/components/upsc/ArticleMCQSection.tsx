import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Brain, 
  CheckCircle2, 
  XCircle, 
  ChevronRight,
  Lightbulb,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { QuizQuestion } from '@/hooks/use-upsc-quizzes';

interface ArticleMCQSectionProps {
  articleTitle: string;
  className?: string;
}

export function ArticleMCQSection({ articleTitle, className }: ArticleMCQSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [answers, setAnswers] = useState<Record<number, { selected: number; isCorrect: boolean }>>({});

  // Find quiz by title match
  const { data: quiz, isLoading } = useQuery({
    queryKey: ['article-mcqs', articleTitle],
    queryFn: async () => {
      const searchTitle = `MCQs: ${articleTitle.slice(0, 50)}`;
      
      const { data, error } = await supabase
        .from('upsc_quizzes')
        .select('*')
        .eq('is_published', true)
        .ilike('title', `%${articleTitle.slice(0, 40)}%`)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        ...data,
        questions: data.questions as unknown as QuizQuestion[]
      };
    },
  });

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[300px] w-full rounded-xl" />
      </div>
    );
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return null; // Don't show anything if no MCQs available
  }

  const questions = quiz.questions;
  const currentQuestion = questions[currentIndex];
  
  const correctCount = Object.values(answers).filter(a => a.isCorrect).length;
  const attemptedCount = Object.keys(answers).length;

  const handleOptionClick = (optionIndex: number) => {
    if (hasSubmitted) return;
    setSelectedAnswer(optionIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;
    
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    setHasSubmitted(true);
    setAnswers(prev => ({
      ...prev,
      [currentIndex]: { selected: selectedAnswer, isCorrect }
    }));
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      const nextAnswer = answers[currentIndex + 1];
      if (nextAnswer) {
        setSelectedAnswer(nextAnswer.selected);
        setHasSubmitted(true);
      } else {
        setSelectedAnswer(null);
        setHasSubmitted(false);
      }
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setHasSubmitted(false);
    setAnswers({});
  };

  const getOptionStyles = (optionIndex: number) => {
    if (!hasSubmitted) {
      return selectedAnswer === optionIndex
        ? 'border-primary bg-primary/10 ring-2 ring-primary'
        : 'border-border hover:border-primary/50 hover:bg-muted/50';
    }

    const isCorrect = optionIndex === currentQuestion.correct_answer;
    const isSelected = optionIndex === selectedAnswer;

    if (isCorrect) {
      return 'border-green-500 bg-green-50 dark:bg-green-950/30';
    }
    if (isSelected && !isCorrect) {
      return 'border-red-500 bg-red-50 dark:bg-red-950/30';
    }
    return 'border-border opacity-60';
  };

  return (
    <Card className={cn("border-2 border-primary/20", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="w-5 h-5 text-primary" />
            Practice MCQs
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {currentIndex + 1}/{questions.length}
            </Badge>
            <Badge variant="outline" className="text-green-600">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              {correctCount}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Question */}
        <div className="font-medium">{currentQuestion.question}</div>

        {/* Options */}
        <div className="space-y-2">
          {currentQuestion.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleOptionClick(idx)}
              disabled={hasSubmitted}
              className={cn(
                "w-full text-left p-3 rounded-lg border-2 transition-all text-sm",
                "flex items-start gap-2",
                getOptionStyles(idx),
                !hasSubmitted && "cursor-pointer"
              )}
            >
              <span className={cn(
                "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-semibold text-xs",
                hasSubmitted && idx === currentQuestion.correct_answer
                  ? "bg-green-500 text-white"
                  : hasSubmitted && idx === selectedAnswer
                  ? "bg-red-500 text-white"
                  : selectedAnswer === idx
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}>
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="flex-1">{option}</span>
            </button>
          ))}
        </div>

        {/* Explanation */}
        {hasSubmitted && currentQuestion.explanation && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-sm">
            <div className="flex items-center gap-1 font-medium text-blue-800 dark:text-blue-200 mb-1">
              <Lightbulb className="w-4 h-4" />
              Explanation
            </div>
            <p className="text-blue-700 dark:text-blue-300">
              {currentQuestion.explanation}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {!hasSubmitted ? (
            <Button 
              onClick={handleSubmitAnswer} 
              disabled={selectedAnswer === null}
              className="flex-1"
              size="sm"
            >
              Submit
            </Button>
          ) : currentIndex < questions.length - 1 ? (
            <Button onClick={handleNextQuestion} className="flex-1" size="sm">
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleReset} variant="outline" className="flex-1" size="sm">
              <RotateCcw className="w-4 h-4 mr-1" />
              Restart
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
