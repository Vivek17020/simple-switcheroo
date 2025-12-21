import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  Trophy,
  Target,
  RotateCcw,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Quiz, QuizQuestion } from '@/hooks/use-upsc-quizzes';

const SUBJECTS = [
  { slug: 'all', name: 'All Subjects', color: 'bg-primary' },
  { slug: 'polity', name: 'Polity & Governance', color: 'bg-blue-500' },
  { slug: 'economy', name: 'Economy', color: 'bg-green-500' },
  { slug: 'geography', name: 'Geography', color: 'bg-amber-500' },
  { slug: 'history', name: 'History', color: 'bg-purple-500' },
  { slug: 'environment', name: 'Environment', color: 'bg-emerald-500' },
  { slug: 'science', name: 'Science & Tech', color: 'bg-cyan-500' },
  { slug: 'current-affairs', name: 'Current Affairs', color: 'bg-red-500' },
];

export default function UPSCTopicMCQs() {
  const { subject } = useParams<{ subject?: string }>();
  const navigate = useNavigate();
  const [activeSubject, setActiveSubject] = useState(subject || 'all');
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, { selected: number; isCorrect: boolean }>>({});
  const [showResults, setShowResults] = useState(false);

  // Fetch all quizzes
  const { data: quizzes, isLoading } = useQuery({
    queryKey: ['upsc-topic-mcqs', activeSubject],
    queryFn: async () => {
      let query = supabase
        .from('upsc_quizzes')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (activeSubject !== 'all') {
        query = query.eq('category', activeSubject);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data.map(quiz => ({
        ...quiz,
        questions: quiz.questions as unknown as QuizQuestion[]
      })) as Quiz[];
    },
  });

  // Get all questions from all quizzes
  const allQuestions = quizzes?.flatMap((quiz, quizIdx) => 
    quiz.questions.map((q, qIdx) => ({
      ...q,
      quizId: quiz.id,
      quizTitle: quiz.title,
      globalIndex: quizIdx * 100 + qIdx,
    }))
  ) || [];

  const currentQuestion = allQuestions[currentQuestionIndex];

  const handleOptionClick = (optionIndex: number) => {
    if (hasSubmitted) return;
    setSelectedAnswer(optionIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null || !currentQuestion) return;
    
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    setHasSubmitted(true);
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: { selected: selectedAnswer, isCorrect }
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setHasSubmitted(false);
    } else {
      setShowResults(true);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      const prevQuestion = allQuestions[currentQuestionIndex - 1];
      const prevAnswer = answers[prevQuestion.id];
      if (prevAnswer) {
        setSelectedAnswer(prevAnswer.selected);
        setHasSubmitted(true);
      } else {
        setSelectedAnswer(null);
        setHasSubmitted(false);
      }
    }
  };

  const handleReset = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setHasSubmitted(false);
    setAnswers({});
    setShowResults(false);
  };

  const getOptionStyles = (optionIndex: number) => {
    if (!hasSubmitted) {
      return selectedAnswer === optionIndex
        ? 'border-primary bg-primary/10 ring-2 ring-primary'
        : 'border-border hover:border-primary/50 hover:bg-muted/50';
    }

    const isCorrect = optionIndex === currentQuestion?.correct_answer;
    const isSelected = optionIndex === selectedAnswer;

    if (isCorrect) {
      return 'border-green-500 bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-200';
    }
    if (isSelected && !isCorrect) {
      return 'border-red-500 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200';
    }
    return 'border-border opacity-60';
  };

  // Calculate stats
  const answeredCount = Object.keys(answers).length;
  const correctCount = Object.values(answers).filter(a => a.isCorrect).length;
  const incorrectCount = answeredCount - correctCount;
  const progressPercent = allQuestions.length > 0 ? (answeredCount / allQuestions.length) * 100 : 0;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (showResults) {
    const percentage = allQuestions.length > 0 ? Math.round((correctCount / allQuestions.length) * 100) : 0;
    
    return (
      <div className="container mx-auto px-4 py-8">
        <Helmet>
          <title>Quiz Results | UPSC Briefs</title>
        </Helmet>
        
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-primary/20">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Trophy className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-2xl">Quiz Completed!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-primary mb-2">{percentage}%</div>
                <p className="text-muted-foreground">Overall Score</p>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{allQuestions.length}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
                <div className="p-4 bg-green-100 dark:bg-green-950/30 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{correctCount}</div>
                  <div className="text-sm text-green-600">Correct</div>
                </div>
                <div className="p-4 bg-red-100 dark:bg-red-950/30 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{incorrectCount}</div>
                  <div className="text-sm text-red-600">Incorrect</div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button onClick={handleReset} className="flex-1">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button variant="outline" onClick={() => navigate('/upscbriefs/practice')} className="flex-1">
                  More Practice
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <Helmet>
        <title>Topic-wise MCQs | UPSC Briefs</title>
        <meta name="description" content="Practice UPSC topic-wise MCQs with instant feedback and detailed explanations." />
      </Helmet>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/upscbriefs/practice')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Topic-wise MCQs</h1>
          <p className="text-muted-foreground">Practice with instant feedback</p>
        </div>
      </div>

      {/* Subject Tabs */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-2 pb-2">
          {SUBJECTS.map(subj => (
            <Button
              key={subj.slug}
              variant={activeSubject === subj.slug ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setActiveSubject(subj.slug);
                handleReset();
              }}
              className="whitespace-nowrap"
            >
              {subj.name}
            </Button>
          ))}
        </div>
      </div>

      {allQuestions.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No MCQs Available</h3>
            <p className="text-muted-foreground mb-4">
              No MCQs found for this subject. Check back later!
            </p>
            <Button onClick={() => setActiveSubject('all')}>
              View All Subjects
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Progress Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={progressPercent} className="h-2" />
                <div className="text-sm text-muted-foreground">
                  {answeredCount} of {allQuestions.length} answered
                </div>
                
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>{correctCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span>{incorrectCount}</span>
                  </div>
                </div>

                {/* Question Navigator */}
                <div className="grid grid-cols-5 gap-1">
                  {allQuestions.slice(0, 20).map((q, idx) => {
                    const answer = answers[q.id];
                    return (
                      <button
                        key={q.id}
                        onClick={() => {
                          setCurrentQuestionIndex(idx);
                          if (answer) {
                            setSelectedAnswer(answer.selected);
                            setHasSubmitted(true);
                          } else {
                            setSelectedAnswer(null);
                            setHasSubmitted(false);
                          }
                        }}
                        className={cn(
                          "w-8 h-8 rounded text-xs font-medium transition-colors",
                          idx === currentQuestionIndex && "ring-2 ring-primary",
                          answer?.isCorrect && "bg-green-500 text-white",
                          answer && !answer.isCorrect && "bg-red-500 text-white",
                          !answer && "bg-muted hover:bg-muted/80"
                        )}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Question Card */}
          <div className="lg:col-span-3">
            {currentQuestion && (
              <Card className="border-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      Question {currentQuestionIndex + 1} of {allQuestions.length}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {currentQuestion.topic}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Question Text */}
                  <div className="text-lg font-medium leading-relaxed">
                    {currentQuestion.question}
                  </div>

                  {/* Options */}
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleOptionClick(idx)}
                        disabled={hasSubmitted}
                        className={cn(
                          "w-full text-left p-4 rounded-lg border-2 transition-all duration-200",
                          "flex items-start gap-3",
                          getOptionStyles(idx),
                          !hasSubmitted && "cursor-pointer"
                        )}
                      >
                        <span className={cn(
                          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm",
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
                        <span className="flex-1 pt-1">{option}</span>
                      </button>
                    ))}
                  </div>

                  {/* Explanation */}
                  {hasSubmitted && currentQuestion.explanation && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Explanation
                      </h4>
                      <p className="text-blue-700 dark:text-blue-300">
                        {currentQuestion.explanation}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handlePreviousQuestion}
                      disabled={currentQuestionIndex === 0}
                    >
                      Previous
                    </Button>
                    
                    {!hasSubmitted ? (
                      <Button 
                        onClick={handleSubmitAnswer} 
                        disabled={selectedAnswer === null}
                        className="flex-1"
                      >
                        Submit Answer
                      </Button>
                    ) : (
                      <Button onClick={handleNextQuestion} className="flex-1">
                        {currentQuestionIndex < allQuestions.length - 1 ? (
                          <>
                            Next Question
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </>
                        ) : (
                          "View Results"
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
