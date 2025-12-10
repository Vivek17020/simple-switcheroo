import { Code2, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Web3Hero() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#6A5BFF]/10 via-background to-[#4AC4FF]/10 py-24 dark:from-[#6A5BFF]/20 dark:to-[#4AC4FF]/20">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-[#6A5BFF]/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#4AC4FF]/20 rounded-full blur-3xl" />
      
      <div className="container relative mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-[#6A5BFF] to-[#4AC4FF] bg-clip-text text-transparent leading-tight">
            Web3 for India
          </h1>
          <p className="text-xl md:text-2xl text-foreground/80 max-w-2xl mx-auto">
            Learn Blockchain, Crypto & Smart Contracts Made for Indians
          </p>
          
          {/* Feature Badges */}
          <div className="flex flex-wrap justify-center gap-6 pt-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/60 backdrop-blur-sm border border-border shadow-sm">
              <Code2 className="w-5 h-5 text-[#6A5BFF]" />
              <span className="text-sm font-medium text-foreground">Hands-on Tutorials</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/60 backdrop-blur-sm border border-border shadow-sm">
              <TrendingUp className="w-5 h-5 text-[#6A5BFF]" />
              <span className="text-sm font-medium text-foreground">Industry Standards</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/60 backdrop-blur-sm border border-border shadow-sm">
              <Users className="w-5 h-5 text-[#6A5BFF]" />
              <span className="text-sm font-medium text-foreground">Indian Context</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 justify-center pt-4">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-[#6A5BFF] to-[#4AC4FF] text-white hover:opacity-90 transition-opacity shadow-lg shadow-[#6A5BFF]/25"
              onClick={() => {
                const element = document.getElementById('learning-paths');
                element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              Start Learning Free
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-2 border-[#6A5BFF] text-[#6A5BFF] hover:bg-[#6A5BFF] hover:text-white"
              onClick={() => {
                const element = document.getElementById('tutorials');
                element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              Explore Topics
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
