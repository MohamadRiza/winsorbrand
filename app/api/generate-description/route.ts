// app/api/generate-description/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory cache
const cache = new Map<string, { response: string; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

// Helper to convert snake/slug strings to Title Case
const toTitleCase = (str: string): string => {
  return str
    .replace(/[-_]/g, ' ')
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

// Helper to format list as "A, B, and C"
const formatList = (items: string[]): string => {
  if (!items || items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
};

// Sophisticated local fallback generator producing 3 rich, elegant paragraphs
const generateFallback = ({
  title,
  watchShape,
  targetGender,
  colorVariants,
  collectionSections,
  giftCategories,
}: {
  title: string;
  watchShape: string;
  targetGender?: string;
  colorVariants?: string[];
  collectionSections?: string[];
  giftCategories?: string[];
}): string => {
  const shape = (watchShape || 'Round').toLowerCase();
  const gender = (targetGender || '').toLowerCase();
  
  const isLadies = gender.includes('ladies') || gender.includes('women');
  const isGents = gender.includes('gents') || gender.includes('men');

  // 1. First paragraph: Design, Silhouette, & Wearability
  let p1 = '';
  if (isLadies) {
    p1 = `Designed for the woman of refined taste, the ${title} unites timeless poise with graceful contemporary proportions. Its sculpted ${shape} silhouette rests effortlessly against the wrist, making it a captivating centerpiece whether paired with tailored daytime attire or styled for an evening celebration. Every contour has been curated to balance feminine delicate grace with enduring poise.`;
  } else if (isGents) {
    p1 = `Engineered with commanding poise for the modern gentleman, the ${title} effortlessly balances masculine sophistication with everyday versatility. Centered around a distinguished ${shape} case profile, it delivers an authoritative wrist presence that transitions seamlessly from corporate boardroom settings to relaxed weekend pursuits.`;
  } else {
    p1 = `Crafted with universal appeal and harmonious proportions, the ${title} represents horological versatility at its finest. Featuring an impeccably balanced ${shape} silhouette, this timepiece adapts effortlessly to any wardrobe, delivering an understated statement of confidence, precision, and modern luxury.`;
  }

  // 2. Second paragraph: Color Variants & Craftsmanship
  let p2 = '';
  const cleanColors = (colorVariants || []).map(c => toTitleCase(c)).filter(Boolean);
  if (cleanColors.length > 0) {
    const formattedColors = formatList(cleanColors);
    p2 = `Bespoke aesthetic character is woven into every detail, presented in an exquisite curation of finishes including ${formattedColors}. Each shade is thoughtfully selected to catch the ambient light with subtle luster, offering the freedom to express individual style and coordinate seamlessly with favorite jewelry pieces and wardrobe staples.`;
  } else {
    p2 = `Every surface reflects artisanal dedication, featuring smooth hand-finished contours and radiant polished accents that catch the light with quiet prestige. The harmonious interplay between the bezel and dial provides depth and visual distinction from every viewing angle.`;
  }

  // 3. Third paragraph: Collection Pedigree & Gifting
  let p3 = '';
  const isLimited = collectionSections?.includes('limited');
  const isSports = collectionSections?.includes('sports');
  const isLuxury = collectionSections?.includes('luxury');
  const isBestseller = collectionSections?.includes('bestsellers');
  const isNew = collectionSections?.includes('new');

  let collectionContext = '';
  if (isLimited) {
    collectionContext = `As a coveted edition within our Limited collection, this timepiece offers an exceptional degree of exclusivity.`;
  } else if (isSports) {
    collectionContext = `Infused with the dynamic spirit of our Sports collection, it pairs active durability with sophisticated luxury.`;
  } else if (isLuxury) {
    collectionContext = `Occupying a proud place within our premier Luxury collection, it exemplifies the highest standards of our horology maison.`;
  } else if (isBestseller) {
    collectionContext = `Celebrated as a perennial favorite in our Bestsellers lineup, it has earned widespread admiration for its dependability and allure.`;
  } else if (isNew) {
    collectionContext = `A premier highlight of our New Arrivals, it introduces a fresh contemporary perspective to classic wristwear.`;
  }

  const cleanGifts = (giftCategories || []).map(g => toTitleCase(g)).filter(Boolean);
  let giftContext = '';
  if (cleanGifts.length > 0) {
    const formattedOccasions = formatList(cleanGifts);
    giftContext = `Whether commemorating a milestone such as ${formattedOccasions}, or celebrating personal achievement, it serves as an enduring keepsake of life's most meaningful chapters.`;
  } else {
    giftContext = `Delivered complete in signature Winsor presentation packaging, it stands as an unforgettable gift for cherished milestones or a distinguished addition to any fine timepiece collection.`;
  }

  p3 = `${collectionContext ? collectionContext + ' ' : ''}${giftContext} Elevate your everyday moments with a timepiece engineered to inspire.`;

  return `${p1}\n\n${p2}\n\n${p3}`;
};

export async function POST(req: NextRequest) {
  try {
    const {
      title,
      modelNo,
      watchShape,
      price,
      warranty,
      specifications,
      targetGender,
      colorVariants,
      collectionSections,
      giftCategories,
      thumbnailUrl,
    } = await req.json();

    if (!title?.trim() || !modelNo?.trim()) {
      return NextResponse.json({ error: 'Title and Model Number are required' }, { status: 400 });
    }

    const shape = watchShape || 'Round';
    const genderLabel = targetGender === 'Ladies' ? "Women's / Ladies" : targetGender === 'Gents' ? "Men's / Gentlemen" : 'Unisex';

    const colorsList = Array.isArray(colorVariants)
      ? colorVariants.map(c => typeof c === 'string' ? c : c?.colorName).filter(Boolean)
      : [];
    const colorsFormatted = colorsList.length > 0 ? colorsList.map(toTitleCase).join(', ') : '';

    const collectionsList = Array.isArray(collectionSections)
      ? collectionSections.map(toTitleCase).filter(Boolean)
      : [];
    const collectionsFormatted = collectionsList.length > 0 ? collectionsList.join(', ') : '';

    const giftsList = Array.isArray(giftCategories)
      ? giftCategories.map(toTitleCase).filter(Boolean)
      : [];
    const giftsFormatted = giftsList.length > 0 ? giftsList.join(', ') : '';

    const cacheKey = `${title}-${modelNo}-${shape}-${targetGender}-${colorsList.join(',')}-${collectionsList.join(',')}-${giftsList.join(',')}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({ description: cached.response, cached: true });
    }

    let extraSpecsText = '';
    if (specifications && typeof specifications === 'object') {
      for (const [k, v] of Object.entries(specifications)) {
        if (v && typeof v === 'string' && v.trim()) {
          extraSpecsText += `${k}: ${v.trim()}, `;
        }
      }
    }

    const prompt = `You are a master luxury horology copywriter for Winsor, an esteemed watch maison in Sri Lanka.
Write a captivating, high-converting product description for a wristwatch in 2 to 3 fluid, elegant paragraphs.

Product Context:
- Watch Title: ${title}
- Target Audience: ${genderLabel}
- Case Silhouette / Shape: ${shape}
${colorsFormatted ? `- Available Color Variants / Finishes: ${colorsFormatted}` : ''}
${collectionsFormatted ? `- Featured Collections: ${collectionsFormatted}` : ''}
${giftsFormatted ? `- Gifting Occasions & Milestones: ${giftsFormatted}` : ''}
${extraSpecsText ? `- Confirmed Specifications: ${extraSpecsText}` : ''}

Strict Copywriting Guidelines:
1. Write exclusively in 2 to 3 cohesive, beautifully written editorial paragraphs.
2. DO NOT include section headers, bullet lists, or repetitive metadata labels like "Price (LKR)", "Model Number:", "Key Specifications:", or "Warranty:". The website already displays price, model number, and warranty in dedicated badges and spec boxes.
3. Seamlessly weave in:
   - The watch's silhouette and aesthetic presence (tailored specifically for ${genderLabel}).
   - The available color variants and finishes, describing how each shade complements personal styling and jewelry.
   - Its collection significance (e.g., luxury prestige, active sports appeal, new arrival highlight, or coveted bestseller).
   - Its appeal as a meaningful personal acquisition or memorable gift for special celebrations and milestones.
4. DO NOT invent or fabricate unsupported technical specifications (e.g., do not claim specific movement calibers, glass coatings, or water depth ratings unless confirmed in the details).
5. Maintain an authentic, prestigious tone reminiscent of world-class watchmakers—persuasive, refined, and captivating.`;

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 7000); // 7s timeout

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 600 },
            }),
          }
        );

        clearTimeout(timeout);

        if (res.ok) {
          const data = await res.json();
          let description = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (description && description.trim()) {
            // Strip any accidental markdown headers if model returned them
            description = description.replace(/^#+\s+.*$/gm, '').trim();
            cache.set(cacheKey, { response: description, timestamp: Date.now() });
            return NextResponse.json({ description, cached: false });
          }
        } else {
          console.warn('Gemini API returned status:', res.status);
        }
      } catch (err: any) {
        console.warn('Gemini call failed or timed out. Using rich editorial template:', err.message);
      }
    }

    // High-quality local fallback generator adhering to the 3-paragraph editorial standard
    const fallbackDesc = generateFallback({
      title,
      watchShape: shape,
      targetGender,
      colorVariants: colorsList,
      collectionSections: collectionsList,
      giftCategories: giftsList,
    });

    cache.set(cacheKey, { response: fallbackDesc, timestamp: Date.now() });

    return NextResponse.json({
      description: fallbackDesc,
      cached: false,
    });
  } catch (error: any) {
    console.error('Generate description error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}