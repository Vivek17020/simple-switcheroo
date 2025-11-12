/**
 * Generate Web Story structured data for Google Discover and Search
 */
export function generateWebStoryStructuredData(story: {
  title: string;
  description: string;
  category: string;
  slug: string;
  published_at: string;
  updated_at: string;
  featured_image?: string;
  slides: Array<{ image: string; text: string }>;
}) {
  const baseUrl = 'https://www.thebulletinbriefs.in';
  const storyUrl = `${baseUrl}/webstories/${story.category.toLowerCase()}/${story.slug}`;
  const ampUrl = `${baseUrl}/amp-story/${story.slug}`;
  const posterImage = story.featured_image || story.slides[0]?.image || `${baseUrl}/logo.png`;

  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": storyUrl
    },
    "headline": story.title,
    "description": story.description || story.title,
    "image": {
      "@type": "ImageObject",
      "url": posterImage,
      "width": 1200,
      "height": 630
    },
    "datePublished": story.published_at,
    "dateModified": story.updated_at || story.published_at,
    "author": {
      "@type": "Organization",
      "name": "TheBulletinBriefs",
      "url": baseUrl
    },
    "publisher": {
      "@type": "NewsMediaOrganization",
      "name": "TheBulletinBriefs",
      "url": baseUrl,
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/logo.png`,
        "width": 200,
        "height": 60
      }
    },
    "articleSection": story.category,
    "articleBody": story.slides.map(slide => slide.text).filter(Boolean).join(' '),
    "keywords": `${story.category}, web stories, visual stories, news`,
    "isAccessibleForFree": true,
    "inLanguage": "en-US",
    // Link to AMP version
    "amphtml": ampUrl
  };
}

/**
 * Validate Web Story data before publishing
 */
export function validateWebStory(story: {
  title: string;
  category: string;
  slides: Array<{ image: string; text: string }>;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!story.title || story.title.length < 5) {
    errors.push('Title must be at least 5 characters long');
  }

  if (story.title && story.title.length > 70) {
    errors.push('Title should be under 70 characters for optimal display');
  }

  if (!story.category) {
    errors.push('Category is required');
  }

  if (!story.slides || story.slides.length < 4) {
    errors.push('Web Story must have at least 4 slides');
  }

  if (story.slides && story.slides.length > 30) {
    errors.push('Web Story should not exceed 30 slides');
  }

  const invalidSlides = story.slides.filter(slide => !slide.image);
  if (invalidSlides.length > 0) {
    errors.push(`${invalidSlides.length} slide(s) missing images`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
