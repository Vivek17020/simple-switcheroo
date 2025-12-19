import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Flashcard } from "@/hooks/use-upsc-flashcards";

interface UPSCFlashcardCardProps {
  flashcard: Flashcard;
  isFlipped: boolean;
  onFlip: () => void;
}

const difficultyColors = {
  easy: "bg-green-100 text-green-700 border-green-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  hard: "bg-red-100 text-red-700 border-red-200",
};

const subjectColors: Record<string, string> = {
  "History": "from-amber-500 to-orange-500",
  "Geography": "from-green-500 to-emerald-500",
  "Polity": "from-blue-500 to-indigo-500",
  "Economy": "from-purple-500 to-violet-500",
  "Science": "from-cyan-500 to-teal-500",
  "Environment": "from-lime-500 to-green-500",
  "Current Affairs": "from-pink-500 to-rose-500",
  "default": "from-gray-500 to-slate-500",
};

export const UPSCFlashcardCard = ({ flashcard, isFlipped, onFlip }: UPSCFlashcardCardProps) => {
  const gradientColor = subjectColors[flashcard.subject] || subjectColors.default;

  return (
    <div 
      className="flashcard-container w-full aspect-[3/4] max-w-md mx-auto cursor-pointer perspective-1000"
      onClick={onFlip}
      role="button"
      aria-label={isFlipped ? "Show question" : "Show answer"}
      tabIndex={0}
      onKeyDown={(e) => e.key === " " && onFlip()}
    >
      <div 
        className={cn(
          "flashcard relative w-full h-full transition-transform duration-500 transform-style-3d",
          isFlipped && "rotate-y-180"
        )}
      >
        {/* Front - Question */}
        <div className={cn(
          "flashcard-front absolute inset-0 backface-hidden rounded-2xl shadow-xl overflow-hidden",
          "bg-gradient-to-br", gradientColor
        )}>
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative h-full flex flex-col p-6 text-white">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <Badge className="bg-white/20 text-white border-white/30 text-xs">
                {flashcard.subject}
              </Badge>
              <Badge className={cn("text-xs border", difficultyColors[flashcard.difficulty])}>
                {flashcard.difficulty}
              </Badge>
            </div>
            
            {/* Topic */}
            {flashcard.topic && (
              <span className="text-sm text-white/70 mb-2">{flashcard.topic}</span>
            )}
            
            {/* Title/Question */}
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-xl md:text-2xl font-bold leading-relaxed mb-4">
                  {flashcard.title}
                </h3>
                <p className="text-lg text-white/90 leading-relaxed">
                  {flashcard.front_content}
                </p>
              </div>
            </div>
            
            {/* Tap hint */}
            <div className="text-center text-white/60 text-sm mt-4">
              Tap to reveal answer
            </div>
          </div>
        </div>

        {/* Back - Answer */}
        <div className="flashcard-back absolute inset-0 backface-hidden rotate-y-180 rounded-2xl shadow-xl overflow-hidden bg-white">
          <div className={cn("h-2 bg-gradient-to-r", gradientColor)} />
          <div className="h-full flex flex-col p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">Answer</span>
              <Badge variant="outline" className="text-xs">
                {flashcard.subject}
              </Badge>
            </div>
            
            {/* Answer content */}
            <div className="flex-1 overflow-y-auto">
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-800 text-base md:text-lg leading-relaxed whitespace-pre-wrap">
                  {flashcard.back_content}
                </p>
              </div>
            </div>
            
            {/* Tap hint */}
            <div className="text-center text-gray-400 text-sm mt-4 pt-4 border-t">
              Tap to see question
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
