# Localized Metadata for Album Pages

## Overview

Album detail pages now use fully localized metadata through `next-intl` translations. This ensures that SEO content (titles, descriptions, keywords) appears in the correct language for each locale.

## What's Localized

### Page Titles
- **English**: `"Album Title - AI Generated Album on PornSpot.ai"`
- **French**: `"Titre de l'Album - Album généré par IA sur PornSpot.ai"`
- **German**: `"Album Titel - KI-generiertes Album auf PornSpot.ai"`
- **Spanish**: `"Título del Álbum - Álbum generado por IA en PornSpot.ai"`
- **Russian**: `"Название Альбома - Альбом, созданный ИИ на PornSpot.ai"`
- **Chinese**: `"相册标题 - PornSpot.ai上的AI生成相册"`

### Meta Descriptions
- Localized descriptions that include the album's tag list
- Call-to-action text in the appropriate language
- Site name integration

### Keywords
- Core SEO keywords translated to each language:
  - "AI album" / "album IA" / "KI-Album" / "álbum IA" / "альбом ИИ" / "AI相册"
  - "generated adult content" / "contenu adulte généré" / etc.

### OpenGraph & Twitter Cards
- Localized social sharing titles and descriptions
- Proper `locale` attribute for OpenGraph
- Locale-aware URLs (`/en/albums/123`, `/fr/albums/123`, etc.)

## Translation Keys Used

All translations are in the `album` namespace:

```json
{
  "album": {
    "notFound": "Album Not Found",
    "defaultDescription": "Explore this AI-generated album: {title}",
    "metaTitle": "{title} - AI Generated Album on {siteName}",
    "metaDescription": "{description}. Create your own custom adult content with {siteName}.",
    "keywords": {
      "aiAlbum": "AI album",
      "generatedContent": "generated adult content", 
      "images": "AI images",
      "videos": "AI videos"
    }
  }
}
```

## Benefits

1. **Better SEO**: Search engines get content in the user's language
2. **Improved CTR**: Social sharing shows localized previews
3. **User Experience**: Consistent language throughout the journey
4. **International Growth**: Each locale gets properly optimized content

## URL Structure

Each album is accessible in all locales:
- `/en/albums/abc123` - English
- `/fr/albums/abc123` - French  
- `/de/albums/abc123` - German
- `/es/albums/abc123` - Spanish
- `/ru/albums/abc123` - Russian
- `/zh/albums/abc123` - Chinese

All are statically generated with ISR revalidation.

## Adding New Locales

When adding a new locale:

1. Add the locale to `locales` array in `i18n.ts`
2. Create the new locale JSON file (e.g., `it.json`)
3. Add the `album` translations in the new language
4. Rebuild to generate static pages for the new locale

The system will automatically:
- Generate static pages for all album/locale combinations  
- Include the new locale in revalidation API calls
- Serve localized metadata for the new language
