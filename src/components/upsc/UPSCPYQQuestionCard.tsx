import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import type { PYQQuestion, PYQAttempt } from '@/hooks/use-upsc-pyq';

interface UPSCPYQQuestionCardProps {
  question: PYQQuestion;
  questionIndex: number;
  existingAttempt?: PYQAttempt;
  onSubmitAnswer: (questionId: string, answer: string, isCorrect: boolean) => void;
  showAnswerImmediately?: boolean;
}

export function UPSCPYQQuestionCard({
  question,
  questionIndex,
  existingAttempt,
  onSubmitAnswer,
  showAnswerImmediately = true,
}: UPSCPYQQuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(existingAttempt?.selected_answer || null);
  const [hasSubmitted, setHasSubmitted] = useState(!!existingAttempt);
  const [showSolution, setShowSolution] = useState(false);

  useEffect(() => {
    if (existingAttempt) {
      setSelectedAnswer(existingAttempt.selected_answer);
      setHasSubmitted(true);
    }
  }, [existingAttempt]);

  const handleOptionClick = (option: string) => {
    if (hasSubmitted) return;
    
    setSelectedAnswer(option);
    
    if (showAnswerImmediately) {
      const isCorrect = option === question.correct_answer;
      setHasSubmitted(true);
      onSubmitAnswer(question.id, option, isCorrect);
    }
  };

  const handleSubmit = () => {
    if (!selectedAnswer || hasSubmitted) return;
    const isCorrect = selectedAnswer === question.correct_answer;
    setHasSubmitted(true);
    onSubmitAnswer(question.id, selectedAnswer, isCorrect);
  };

  const getOptionStyles = (option: string) => {
    if (!hasSubmitted) {
      return selectedAnswer === option
        ? 'border-primary bg-primary/10 ring-2 ring-primary'
        : 'border-border hover:border-primary/50 hover:bg-muted/50';
    }

    const isCorrect = option === question.correct_answer;
    const isSelected = option === selectedAnswer;

    if (isCorrect) {
      return 'border-green-500 bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-200';
    }
    if (isSelected && !isCorrect) {
      return 'border-red-500 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200';
    }
    return 'border-border opacity-60';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const options = question.options as { a: string; b: string; c: string; d: string };

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
      {/* Question Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
            {questionIndex + 1}
          </span>
          <div className="flex flex-wrap gap-2">
            {question.year && (
              <Badge variant="outline" className="text-xs">
                {question.year}
              </Badge>
            )}
            {question.subject && (
              <Badge variant="secondary" className="text-xs">
                {question.subject}
              </Badge>
            )}
            <Badge className={cn('text-xs', getDifficultyColor(question.difficulty))}>
              {question.difficulty}
            </Badge>
          </div>
        </div>
        {hasSubmitted && (
          <div className="flex items-center gap-1">
            {selectedAnswer === question.correct_answer ? (
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            ) : (
              <XCircle className="w-6 h-6 text-red-500" />
            )}
          </div>
        )}
      </div>

      {/* Passage (if any) */}
      {question.passage && (
        <div className="mb-4 p-4 bg-muted/50 rounded-lg border-l-4 border-primary">
          <p className="text-sm text-muted-foreground italic whitespace-pre-wrap">
            {question.passage}
          </p>
        </div>
      )}

      {/* Question Text */}
      <div className="mb-6">
        <p className="text-foreground font-medium leading-relaxed whitespace-pre-wrap">
          {question.question_text}
        </p>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-4">
        {(['a', 'b', 'c', 'd'] as const).map((key) => (
          <button
            key={key}
            onClick={() => handleOptionClick(key)}
            disabled={hasSubmitted}
            className={cn(
              'w-full text-left p-4 rounded-lg border-2 transition-all duration-200',
              'flex items-start gap-3',
              getOptionStyles(key),
              !hasSubmitted && 'cursor-pointer'
            )}
          >
            <span className={cn(
              'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-semibold text-sm',
              hasSubmitted && key === question.correct_answer
                ? 'bg-green-500 text-white'
                : hasSubmitted && key === selectedAnswer
                ? 'bg-red-500 text-white'
                : selectedAnswer === key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            )}>
              {key.toUpperCase()}
            </span>
            <span className="flex-1 pt-0.5">{options[key]}</span>
          </button>
        ))}
      </div>

      {/* Submit Button (if not auto-submit) */}
      {!showAnswerImmediately && !hasSubmitted && selectedAnswer && (
        <Button onClick={handleSubmit} className="w-full mb-4">
          Submit Answer
        </Button>
      )}

      {/* Solution Collapsible */}
      {hasSubmitted && question.explanation && (
        <Collapsible open={showSolution} onOpenChange={setShowSolution}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
            >
              <Lightbulb className="w-4 h-4" />
              {showSolution ? 'Hide Solution' : 'View Solution'}
              {showSolution ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Explanation
              </h4>
              <p className="text-blue-700 dark:text-blue-300 whitespace-pre-wrap">
                {question.explanation}
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
