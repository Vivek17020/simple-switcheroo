import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  Clock, 
  BookOpen, 
  Target, 
  AlertTriangle,
  PlayCircle,
  Info
} from 'lucide-react';
import { useQuiz, UserAnswer } from '@/hooks/use-upsc-quizzes';
import { UPSCQuizPlayer } from '@/components/upsc/UPSCQuizPlayer';
import { UPSCQuizResult } from '@/components/upsc/UPSCQuizResult';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

type QuizState = 'instructions' | 'playing' | 'result';

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

const UPSCQuizPage = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const { data: quiz, isLoading, error } = useQuiz(quizId);
  const [quizState, setQuizState] = useState<QuizState>('instructions');
  const [result, setResult] = useState<QuizResultData | null>(null);

  const handleStartQuiz = () => {
    setQuizState('playing');
  };

  const handleQuizComplete = async (attemptId: string) => {
    const { data } = await supabase
      .from('upsc_quiz_attempts')
      .select('*')
      .eq('id', attemptId)
      .single();

    if (data) {
      setResult({
        total_questions: data.total_questions,
        attempted: data.attempted,
        correct: data.correct,
        incorrect: data.incorrect,
        skipped: data.skipped,
        score: Number(data.score),
        max_score: Number(data.max_score),
        percentage: Number(data.percentage),
        time_taken_seconds: data.time_taken_seconds || 0,
        answers: data.answers as unknown as UserAnswer[],
      });
      setQuizState('result');
    }
  };

  const handleRetry = () => {
    setResult(null);
    setQuizState('instructions');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Card className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Quiz Not Found</h1>
            <p className="text-muted-foreground mb-4">
              The quiz you're looking for doesn't exist or has been removed.
            </p>
            <Link to="/upscbriefs/practice">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Practice
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  // Playing State - Full screen quiz player
  if (quizState === 'playing') {
    return (
      <>
        <Helmet>
          <title>{quiz.title} - UPSC Quiz | TB Briefs</title>
        </Helmet>
        <UPSCQuizPlayer quiz={quiz} onComplete={handleQuizComplete} />
      </>
    );
  }

  // Result State
  if (quizState === 'result' && result) {
    return (
      <>
        <Helmet>
          <title>Quiz Result - {quiz.title} | TB Briefs</title>
        </Helmet>
        <UPSCQuizResult quiz={quiz} result={result} onRetry={handleRetry} />
      </>
    );
  }

  // Instructions State
  return (
    <>
      <Helmet>
        <title>{quiz.title} - UPSC Quiz | TB Briefs</title>
        <meta name="description" content={quiz.description || `Take the ${quiz.title} quiz to test your UPSC preparation knowledge.`} />
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link 
            to="/upscbriefs/practice" 
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Practice
          </Link>

          <Card className="overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600/10 to-green-500/5 p-6 border-b">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge className={cn(
                  quiz.difficulty === 'easy' && 'bg-green-100 text-green-800',
                  quiz.difficulty === 'medium' && 'bg-amber-100 text-amber-800',
                  quiz.difficulty === 'hard' && 'bg-red-100 text-red-800'
                )}>
                  {quiz.difficulty}
                </Badge>
                {quiz.subject && <Badge variant="secondary">{quiz.subject}</Badge>}
                <Badge variant="outline">{quiz.category}</Badge>
              </div>
              <h1 className="text-2xl font-bold mb-2">{quiz.title}</h1>
              {quiz.description && (
                <p className="text-muted-foreground">{quiz.description}</p>
              )}
            </div>

            {/* Quiz Details */}
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-100 rounded-lg">
                  <BookOpen className="h-6 w-6 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold">{quiz.questions.length}</div>
                  <p className="text-xs text-muted-foreground">Questions</p>
                </div>
                <div className="text-center p-4 bg-gray-100 rounded-lg">
                  <Clock className="h-6 w-6 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold">{quiz.duration_minutes}</div>
                  <p className="text-xs text-muted-foreground">Minutes</p>
                </div>
                <div className="text-center p-4 bg-gray-100 rounded-lg">
                  <Target className="h-6 w-6 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold">{quiz.total_marks}</div>
                  <p className="text-xs text-muted-foreground">Total Marks</p>
                </div>
                <div className="text-center p-4 bg-gray-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-amber-500" />
                  <div className="text-2xl font-bold">-{quiz.negative_marking}</div>
                  <p className="text-xs text-muted-foreground">Negative Mark</p>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <Info className="h-5 w-5 text-blue-600" />
                  Instructions
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">1.</span>
                    Each correct answer carries <strong>1 mark</strong>.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">2.</span>
                    Each incorrect answer has a penalty of <strong>{quiz.negative_marking} marks</strong>.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">3.</span>
                    Unanswered questions carry <strong>no marks</strong>.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">4.</span>
                    You can mark questions for review and navigate between questions.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">5.</span>
                    The quiz will auto-submit when time runs out.
                  </li>
                </ul>
              </div>

              {/* Start Button */}
              <Button 
                size="lg" 
                className="w-full text-lg py-6 bg-green-600 hover:bg-green-700"
                onClick={handleStartQuiz}
              >
                <PlayCircle className="h-6 w-6 mr-2" />
                Start Quiz
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default UPSCQuizPage;
