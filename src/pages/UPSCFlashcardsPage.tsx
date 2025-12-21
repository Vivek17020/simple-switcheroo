import { useState, useMemo, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft, Filter, Shuffle, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { UPSCBreadcrumb } from "@/components/upsc/UPSCBreadcrumb";
import { UPSCFlashcardPlayer } from "@/components/upsc/UPSCFlashcardPlayer";
import { UPSCFlashcardStats } from "@/components/upsc/UPSCFlashcardStats";
import { 
  useUPSCFlashcards, 
  useFlashcardProgress, 
  useUpdateFlashcardProgress 
} from "@/hooks/use-upsc-flashcards";
import { cn } from "@/lib/utils";

const subjects = [
  { name: "All", value: "" },
  { name: "History", value: "History" },
  { name: "Geography", value: "Geography" },
  { name: "Polity", value: "Polity" },
  { name: "Economy", value: "Economy" },
  { name: "Science", value: "Science" },
  { name: "Environment", value: "Environment" },
  { name: "Current Affairs", value: "Current Affairs" },
];

const difficulties = [
  { name: "All", value: "" },
  { name: "Easy", value: "easy" },
  { name: "Medium", value: "medium" },
  { name: "Hard", value: "hard" },
];

const UPSCFlashcardsPage = () => {
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isShuffled, setIsShuffled] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    viewed: 0,
    mastered: 0,
    learning: 0,
  });

  const { data: allFlashcards, isLoading } = useUPSCFlashcards(selectedSubject || undefined);
  const { data: progress = [] } = useFlashcardProgress();
  const updateProgress = useUpdateFlashcardProgress();

  // Filter and optionally shuffle flashcards
  const flashcards = useMemo(() => {
    let filtered = allFlashcards || [];
    
    if (selectedDifficulty) {
      filtered = filtered.filter(f => f.difficulty === selectedDifficulty);
    }

    if (isShuffled) {
      return [...filtered].sort(() => Math.random() - 0.5);
    }
    
    return filtered;
  }, [allFlashcards, selectedDifficulty, isShuffled]);

  // Handle mastery update
  const handleMastery = useCallback((flashcardId: string, level: number) => {
    updateProgress.mutate({ flashcard_id: flashcardId, mastery_level: level });
    
    setSessionStats(prev => ({
      viewed: prev.viewed + 1,
      mastered: level >= 4 ? prev.mastered + 1 : prev.mastered,
      learning: level < 4 ? prev.learning + 1 : prev.learning,
    }));
  }, [updateProgress]);

  // Reset filters
  const handleReset = () => {
    setSelectedSubject("");
    setSelectedDifficulty("");
    setCurrentIndex(0);
    setIsShuffled(false);
    setSessionStats({ viewed: 0, mastered: 0, learning: 0 });
  };

  // Shuffle cards
  const handleShuffle = () => {
    setIsShuffled(true);
    setCurrentIndex(0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>UPSC Flashcards | Quick Revision Cards for IAS Preparation</title>
        <meta 
          name="description" 
          content="Interactive flashcards for UPSC preparation. Practice with swipe gestures, track your mastery, and revise key concepts for Prelims and Mains." 
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.thebulletinbriefs.in/upscbriefs/flashcards" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <section className="bg-gradient-to-br from-green-900 to-green-700 text-white py-8 md:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <UPSCBreadcrumb 
              items={[
                { label: "Practice", href: "/upscbriefs/practice" },
                { label: "Flashcards", href: "/upscbriefs/flashcards" }
              ]} 
            />
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <Badge className="bg-white/20 text-white mb-2">Interactive Learning</Badge>
                <h1 className="text-2xl md:text-3xl font-bold">UPSC Flashcards</h1>
                <p className="text-green-100 mt-1 text-sm md:text-base">
                  Swipe through cards, test your memory, track mastery
                </p>
              </div>
              <Link to="/upscbriefs/practice">
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Practice
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {flashcards.length === 0 ? (
            /* Empty state */
            <Card className="max-w-md mx-auto mt-8">
              <CardContent className="p-8 text-center">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Flashcards Available
                </h3>
                <p className="text-gray-600 mb-4">
                  {selectedSubject || selectedDifficulty 
                    ? "Try changing your filters to see more cards."
                    : "Check back soon for new flashcards!"}
                </p>
                {(selectedSubject || selectedDifficulty) && (
                  <Button onClick={handleReset} variant="outline">
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main flashcard area */}
              <div className="lg:col-span-2 space-y-4">
                {/* Filters */}
                <div className="space-y-3">
                  {/* Subject filter */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Filter className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Subject</span>
                    </div>
                    <ScrollArea className="w-full whitespace-nowrap">
                      <div className="flex gap-2 pb-2">
                        {subjects.map((subject) => (
                          <Button
                            key={subject.value}
                            variant={selectedSubject === subject.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              setSelectedSubject(subject.value);
                              setCurrentIndex(0);
                            }}
                            className={cn(
                              "shrink-0",
                              selectedSubject === subject.value && "bg-green-600 hover:bg-green-700"
                            )}
                          >
                            {subject.name}
                          </Button>
                        ))}
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </div>

                  {/* Difficulty and actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {difficulties.map((diff) => (
                      <Badge
                        key={diff.value}
                        variant={selectedDifficulty === diff.value ? "default" : "outline"}
                        className={cn(
                          "cursor-pointer transition-colors",
                          selectedDifficulty === diff.value 
                            ? "bg-green-600 hover:bg-green-700" 
                            : "hover:bg-gray-100"
                        )}
                        onClick={() => {
                          setSelectedDifficulty(diff.value);
                          setCurrentIndex(0);
                        }}
                      >
                        {diff.name}
                      </Badge>
                    ))}
                    
                    <div className="flex-1" />
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleShuffle}
                      className="text-gray-600"
                    >
                      <Shuffle className="w-4 h-4 mr-1" />
                      Shuffle
                    </Button>
                  </div>
                </div>

                {/* Flashcard Player */}
                <Card className="shadow-lg border-0">
                  <CardContent className="p-4 md:p-6">
                    <UPSCFlashcardPlayer
                      flashcards={flashcards}
                      onMastery={handleMastery}
                      currentIndex={currentIndex}
                      onIndexChange={setCurrentIndex}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Stats sidebar */}
              <div className="space-y-4">
                <UPSCFlashcardStats
                  totalCards={allFlashcards?.length || 0}
                  progress={progress}
                  sessionStats={sessionStats}
                />

                {/* Quick tips */}
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Quick Tips</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start gap-2">
                        <span className="text-green-600">•</span>
                        <span>Tap card to flip and reveal answer</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600">•</span>
                        <span>Swipe left/right to navigate cards</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600">•</span>
                        <span>Mark cards as "Know It" or "Learning"</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600">•</span>
                        <span>Use keyboard shortcuts on desktop</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UPSCFlashcardsPage;
