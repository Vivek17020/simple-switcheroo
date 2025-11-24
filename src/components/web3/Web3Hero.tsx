import { Code2, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Web3Hero() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[hsl(var(--web3-primary))]/10 via-[hsl(var(--web3-bg-dark))] to-[hsl(var(--web3-secondary))]/10 py-24">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-[hsl(var(--web3-primary))]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-[hsl(var(--web3-secondary))]/10 rounded-full blur-3xl" />
      
      <div className="container relative mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-[hsl(var(--web3-primary))] to-[hsl(var(--web3-secondary))] bg-clip-text text-transparent leading-tight">
            Web3 for India
          </h1>
          <p className="text-xl md:text-2xl text-[hsl(var(--web3-text-dark-muted))] max-w-2xl mx-auto">
            Learn Blockchain, Crypto & Smart Contracts Made for Indians
          </p>
          
          {/* Feature Badges */}
          <div className="flex flex-wrap justify-center gap-6 pt-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--web3-bg-dark-elevated))]/60 backdrop-blur-sm border border-[hsl(var(--web3-border-dark))] shadow-sm">
              <Code2 className="w-5 h-5 text-[hsl(var(--web3-primary))]" />
              <span className="text-sm font-medium text-[hsl(var(--web3-text-dark))]">Hands-on Tutorials</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--web3-bg-dark-elevated))]/60 backdrop-blur-sm border border-[hsl(var(--web3-border-dark))] shadow-sm">
              <TrendingUp className="w-5 h-5 text-[hsl(var(--web3-primary))]" />
              <span className="text-sm font-medium text-[hsl(var(--web3-text-dark))]">Industry Standards</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--web3-bg-dark-elevated))]/60 backdrop-blur-sm border border-[hsl(var(--web3-border-dark))] shadow-sm">
              <Users className="w-5 h-5 text-[hsl(var(--web3-primary))]" />
              <span className="text-sm font-medium text-[hsl(var(--web3-text-dark))]">Indian Context</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 justify-center pt-4">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-[hsl(var(--web3-primary))] to-[hsl(var(--web3-secondary))] text-white hover:opacity-90 transition-opacity shadow-lg shadow-[hsl(var(--web3-primary))]/25"
            >
              Start Learning Free
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-2 border-[hsl(var(--web3-primary))] text-[hsl(var(--web3-primary))] hover:bg-[hsl(var(--web3-primary))] hover:text-white"
            >
              Explore Topics
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
