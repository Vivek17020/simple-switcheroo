import { useRef, useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Flashcard } from "@/hooks/use-upsc-flashcards";
import { UPSCFlashcardCard } from "./UPSCFlashcardCard";
import { useSwipeGesture } from "@/hooks/use-swipe-gesture";

interface UPSCFlashcardPlayerProps {
  flashcards: Flashcard[];
  onMastery: (flashcardId: string, level: number) => void;
  currentIndex: number;
  onIndexChange: (index: number) => void;
}

export const UPSCFlashcardPlayer = ({
  flashcards,
  onMastery,
  currentIndex,
  onIndexChange,
}: UPSCFlashcardPlayerProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentCard = flashcards[currentIndex];
  const progress = ((currentIndex + 1) / flashcards.length) * 100;

  const goToNext = useCallback(() => {
    if (currentIndex < flashcards.length - 1) {
      setSlideDirection("left");
      setIsFlipped(false);
      setTimeout(() => {
        onIndexChange(currentIndex + 1);
        setSlideDirection(null);
      }, 150);
    }
  }, [currentIndex, flashcards.length, onIndexChange]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setSlideDirection("right");
      setIsFlipped(false);
      setTimeout(() => {
        onIndexChange(currentIndex - 1);
        setSlideDirection(null);
      }, 150);
    }
  }, [currentIndex, onIndexChange]);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleKnowIt = useCallback(() => {
    onMastery(currentCard.id, 5);
    goToNext();
  }, [currentCard, onMastery, goToNext]);

  const handleStillLearning = useCallback(() => {
    onMastery(currentCard.id, 2);
    goToNext();
  }, [currentCard, onMastery, goToNext]);

  // Swipe gestures
  const swipeState = useSwipeGesture(containerRef, {
    onSwipeLeft: goToNext,
    onSwipeRight: goToPrevious,
    minSwipeDistance: 60,
    edgeOnly: false,
  });

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        goToNext();
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleFlip();
      } else if (e.key === "k" || e.key === "K") {
        handleKnowIt();
      } else if (e.key === "l" || e.key === "L") {
        handleStillLearning();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNext, goToPrevious, handleFlip, handleKnowIt, handleStillLearning]);

  if (!currentCard) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">No flashcards available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Card {currentIndex + 1} of {flashcards.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Card container with swipe */}
      <div 
        ref={containerRef}
        className={cn(
          "flex-1 relative touch-pan-y",
          swipeState.isSwiping && "select-none"
        )}
      >
        {/* Swipe indicators */}
        {swipeState.isSwiping && (
          <>
            <div 
              className={cn(
                "absolute left-0 top-0 bottom-0 w-16 z-10 flex items-center justify-center transition-opacity",
                swipeState.direction === "right" ? "opacity-100" : "opacity-0"
              )}
              style={{ background: `linear-gradient(to right, rgba(34, 197, 94, ${swipeState.progress * 0.3}), transparent)` }}
            >
              <ChevronLeft className="w-8 h-8 text-green-600" />
            </div>
            <div 
              className={cn(
                "absolute right-0 top-0 bottom-0 w-16 z-10 flex items-center justify-center transition-opacity",
                swipeState.direction === "left" ? "opacity-100" : "opacity-0"
              )}
              style={{ background: `linear-gradient(to left, rgba(34, 197, 94, ${swipeState.progress * 0.3}), transparent)` }}
            >
              <ChevronRight className="w-8 h-8 text-green-600" />
            </div>
          </>
        )}

        {/* Flashcard with slide animation */}
        <div 
          className={cn(
            "h-full transition-all duration-150",
            slideDirection === "left" && "-translate-x-4 opacity-0",
            slideDirection === "right" && "translate-x-4 opacity-0"
          )}
        >
          <UPSCFlashcardCard
            flashcard={currentCard}
            isFlipped={isFlipped}
            onFlip={handleFlip}
          />
        </div>
      </div>

      {/* Navigation and action buttons */}
      <div className="mt-6 space-y-4">
        {/* Mastery buttons - only show when flipped */}
        {isFlipped && (
          <div className="flex gap-3 justify-center animate-fade-in">
            <Button
              variant="outline"
              size="lg"
              onClick={handleStillLearning}
              className="flex-1 max-w-[160px] border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              <X className="w-4 h-4 mr-2" />
              Still Learning
            </Button>
            <Button
              size="lg"
              onClick={handleKnowIt}
              className="flex-1 max-w-[160px] bg-green-600 hover:bg-green-700 text-white"
            >
              <Check className="w-4 h-4 mr-2" />
              I Knew It!
            </Button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="lg"
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className="gap-2"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Previous</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsFlipped(false);
              onIndexChange(0);
            }}
            className="text-gray-500"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Restart
          </Button>

          <Button
            variant="ghost"
            size="lg"
            onClick={goToNext}
            disabled={currentIndex === flashcards.length - 1}
            className="gap-2"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Keyboard hints - desktop only */}
        <div className="hidden md:flex justify-center gap-4 text-xs text-gray-400">
          <span>← → Navigate</span>
          <span>Space: Flip</span>
          <span>K: Know it</span>
          <span>L: Learning</span>
        </div>
      </div>
    </div>
  );
};
