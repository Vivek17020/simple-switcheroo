import { useEffect } from "react";
import { useArticles } from "@/hooks/use-articles";

export default function NewsletterPreferencesPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold mb-4">Newsletter Preferences</h1>
        <p className="text-muted-foreground mb-6">
          This page would allow users to manage their newsletter subscription preferences.
        </p>
        <p className="text-sm text-muted-foreground">
          Implementation can include frequency settings, category preferences, and unsubscribe options.
        </p>
      </div>
    </div>
  );
}