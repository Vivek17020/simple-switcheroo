import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArticleCard } from '@/components/public/article-card';
import { PremiumGate } from './premium-gate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Lock } from 'lucide-react';
import { useArticles } from '@/hooks/use-articles';

interface PremiumArticleListProps {
  categorySlug?: string;
  limit?: number;
  showGate?: boolean;
}

export const PremiumArticleList = ({ 
  categorySlug, 
  limit = 6, 
  showGate = true 
}: PremiumArticleListProps) => {
  const navigate = useNavigate();
  const { data, isLoading } = useArticles(categorySlug, 1, limit);
  
  // For demo purposes, mark some articles as premium
  const premiumArticles = data?.articles?.map((article, index) => ({
    ...article,
    is_premium: index % 3 === 0, // Every 3rd article is premium for demo
    premium_preview_length: 200
  }));

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-48 bg-muted rounded-t-lg" />
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded mb-2" />
              <div className="h-4 bg-muted rounded mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!premiumArticles?.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Crown className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Premium Articles Yet</h3>
          <p className="text-muted-foreground text-center">
            Premium content is being prepared. Check back soon for exclusive articles.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 mb-6">
        <Crown className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Premium Articles</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {premiumArticles.map((article) => (
          <div key={article.id} className="relative">
            <ArticleCard
              article={article}
            />
            
            {article.is_premium && (
              <div className="absolute top-3 right-3 z-10">
                <div className="bg-primary text-primary-foreground rounded-full p-2">
                  <Lock className="h-4 w-4" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {showGate && (
        <div className="mt-8">
          <PremiumGate
            isPremium={true}
            previewContent="Unlock access to our entire premium article collection with exclusive interviews, in-depth analysis, and breaking news coverage."
            onSubscribe={() => navigate('/subscription')}
          >
            <div>Premium content placeholder</div>
          </PremiumGate>
        </div>
      )}
    </div>
  );
};