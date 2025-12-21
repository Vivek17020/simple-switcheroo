import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, Image, CheckCircle, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export function ImageOptimizationStatus() {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);

  const handleOptimizeExisting = async () => {
    setIsOptimizing(true);
    setOptimizationResult(null);

    try {
      toast({
        title: "Starting optimization",
        description: "Processing all existing images. This may take a few minutes...",
      });

      const { data, error } = await supabase.functions.invoke('optimize-existing-images');

      if (error) throw error;

      setOptimizationResult(data.result);

      toast({
        title: "Optimization complete!",
        description: `Optimized ${data.result.optimized} images successfully.`,
      });
    } catch (error) {
      console.error('Optimization error:', error);
      toast({
        title: "Optimization failed",
        description: error.message || "Failed to optimize images",
        variant: "destructive",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Image Optimization
        </CardTitle>
        <CardDescription>
          Automatically compress and optimize all images for better performance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            All new uploads are automatically optimized. Use this tool to optimize existing images.
          </p>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
            <li>Reduces file size by 50-70% without quality loss</li>
            <li>Converts PNG to WebP format automatically</li>
            <li>Resizes images larger than 2000px width</li>
            <li>Improves page load speed and LCP scores</li>
          </ul>
        </div>

        <Button
          onClick={handleOptimizeExisting}
          disabled={isOptimizing}
          className="w-full"
        >
          {isOptimizing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Optimizing Images...
            </>
          ) : (
            <>
              <Image className="mr-2 h-4 w-4" />
              Optimize All Existing Images
            </>
          )}
        </Button>

        {optimizationResult && (
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Images</span>
              <span className="text-sm">{optimizationResult.total}</span>
            </div>
            <div className="flex items-center justify-between text-green-600">
              <span className="text-sm font-medium flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Optimized
              </span>
              <span className="text-sm">{optimizationResult.optimized}</span>
            </div>
            <div className="flex items-center justify-between text-yellow-600">
              <span className="text-sm font-medium">Skipped (already optimized)</span>
              <span className="text-sm">{optimizationResult.skipped}</span>
            </div>
            {optimizationResult.failed > 0 && (
              <div className="flex items-center justify-between text-red-600">
                <span className="text-sm font-medium flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Failed
                </span>
                <span className="text-sm">{optimizationResult.failed}</span>
              </div>
            )}
            <Progress 
              value={(optimizationResult.optimized / optimizationResult.total) * 100} 
              className="h-2"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
