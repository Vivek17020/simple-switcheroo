import { useState, useEffect } from "react";
import { Target, Flame, BookOpen, Trophy } from "lucide-react";

interface UPSCHeroProps {
  totalArticles: number;
}

const UPSCHero = ({ totalArticles }: UPSCHeroProps) => {
  const [daysToExam, setDaysToExam] = useState(0);
  
  useEffect(() => {
    // UPSC Prelims date (usually 4th Sunday of May)
    const today = new Date();
    const currentYear = today.getFullYear();
    // If we're past May 25 of current year, show next year's exam
    let examYear = currentYear;
    const thisYearExam = new Date(`${currentYear}-05-25`);
    if (today > thisYearExam) {
      examYear = currentYear + 1;
    }
    const prelimsDate = new Date(`${examYear}-05-25`);
    const diffTime = prelimsDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setDaysToExam(Math.max(0, diffDays));
  }, []);

  const motivationalQuotes = [
    "Success is not final, failure is not fatal.",
    "The only way to do great work is to love what you do.",
    "Believe you can and you're halfway there.",
    "Every expert was once a beginner.",
  ];
  
  const todayQuote = motivationalQuotes[new Date().getDate() % motivationalQuotes.length];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left: Main content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-amber-500/20 backdrop-blur-sm border border-amber-500/30 rounded-full px-4 py-2 mb-6">
              <Target className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-200">UPSC Study Command Center</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Your Mission:
              <span className="block bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                Crack UPSC 2025
              </span>
            </h1>
            
            <p className="text-blue-200 text-lg mb-6 max-w-xl">
              "{todayQuote}"
            </p>
            
            {/* Quick stats */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-4">
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                <span className="text-sm">{totalArticles}+ Articles</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span className="text-sm">9 Subjects</span>
              </div>
            </div>
          </div>
          
          {/* Right: Countdown timer */}
          <div className="flex justify-center lg:justify-end">
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 md:p-8 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Flame className="w-6 h-6 text-orange-500 animate-pulse" />
                <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Days to Prelims 2025</span>
              </div>
              
              <div className="text-6xl md:text-7xl font-black bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent mb-2">
                {daysToExam}
              </div>
              
              <p className="text-slate-400 text-sm">
                Make every day count
              </p>
              
              {/* Progress indicator */}
              <div className="mt-6 pt-6 border-t border-slate-700">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-400">P</div>
                    <div className="text-xs text-slate-500">Prelims</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-600">M</div>
                    <div className="text-xs text-slate-500">Mains</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-600">I</div>
                    <div className="text-xs text-slate-500">Interview</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UPSCHero;
