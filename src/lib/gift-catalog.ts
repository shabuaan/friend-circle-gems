export type Budget = "under-25" | "25-75" | "75-plus";

export const BUDGET_LABELS: Record<Budget, string> = {
  "under-25": "Under $25",
  "25-75": "$25 – $75",
  "75-plus": "$75 and up",
};

export interface CatalogGift {
  title: string;
  reason: string;
  budget: Budget;
}

interface CatalogEntry {
  /** Keywords matched against a friend's interests and favourites. */
  match: string[];
  gifts: CatalogGift[];
}

export const GIFT_CATALOG: CatalogEntry[] = [
  {
    match: ["coffee", "espresso", "cafe", "latte"],
    gifts: [
      { title: "Single-origin bean sampler", reason: "Three roasts to taste side by side", budget: "under-25" },
      { title: "Pour-over kit with a gooseneck kettle", reason: "Upgrades the daily morning ritual", budget: "25-75" },
      { title: "Burr grinder", reason: "The one upgrade every coffee person notices", budget: "75-plus" },
    ],
  },
  {
    match: ["tea", "matcha", "chai"],
    gifts: [
      { title: "Loose-leaf tea flight", reason: "A small tin of six different leaves", budget: "under-25" },
      { title: "Cast-iron teapot", reason: "Keeps a pot hot through a long afternoon", budget: "25-75" },
    ],
  },
  {
    match: ["reading", "books", "novels", "literature", "poetry"],
    gifts: [
      { title: "Hardback by a favourite author", reason: "Signed or special edition if you can find one", budget: "under-25" },
      { title: "Book-subscription box", reason: "A new pick arrives every month", budget: "25-75" },
      { title: "E-reader", reason: "For someone whose shelves have run out of room", budget: "75-plus" },
    ],
  },
  {
    match: ["music", "guitar", "piano", "singing", "concerts", "vinyl"],
    gifts: [
      { title: "Vinyl of an album they love", reason: "Physical copy of something on repeat", budget: "under-25" },
      { title: "Concert tickets", reason: "An evening out beats an object", budget: "25-75" },
      { title: "Bluetooth turntable or studio headphones", reason: "Serious listening upgrade", budget: "75-plus" },
    ],
  },
  {
    match: ["gaming", "games", "playstation", "xbox", "nintendo", "pc"],
    gifts: [
      { title: "Game gift card", reason: "Lets them pick the release they actually want", budget: "under-25" },
      { title: "Indie game bundle", reason: "Handful of titles they may have missed", budget: "25-75" },
      { title: "Mechanical keyboard or controller", reason: "Gear they will use every session", budget: "75-plus" },
    ],
  },
  {
    match: ["cooking", "baking", "food", "chef", "kitchen"],
    gifts: [
      { title: "Small-batch spice set", reason: "Instant variety in everyday cooking", budget: "under-25" },
      { title: "Cookbook from a cuisine they love", reason: "Match it to their favourite food", budget: "25-75" },
      { title: "Cast-iron pan or a good chef's knife", reason: "Lasts decades on the counter", budget: "75-plus" },
    ],
  },
  {
    match: ["fitness", "gym", "running", "yoga", "cycling", "hiking", "sports"],
    gifts: [
      { title: "Resistance band set", reason: "Travels with them anywhere", budget: "under-25" },
      { title: "Insulated water bottle or a good gym towel set", reason: "Everyday kit they will actually carry", budget: "25-75" },
      { title: "Smart watch or quality trainers", reason: "For someone training seriously", budget: "75-plus" },
    ],
  },
  {
    match: ["travel", "backpacking", "flights", "adventure"],
    gifts: [
      { title: "Packing cubes", reason: "The gift every traveller ends up loving", budget: "under-25" },
      { title: "Compact travel pillow and eye mask set", reason: "Makes long hauls survivable", budget: "25-75" },
      { title: "Carry-on suitcase", reason: "A real upgrade for frequent trips", budget: "75-plus" },
    ],
  },
  {
    match: ["art", "painting", "drawing", "sketching", "craft", "design"],
    gifts: [
      { title: "Quality sketchbook and pens", reason: "Good paper makes practice a pleasure", budget: "under-25" },
      { title: "Watercolour or gouache set", reason: "New medium to experiment with", budget: "25-75" },
      { title: "Drawing tablet", reason: "Bridges their sketching into digital work", budget: "75-plus" },
    ],
  },
  {
    match: ["photography", "camera", "film"],
    gifts: [
      { title: "Rolls of film or a lens cloth kit", reason: "Consumables they always need", budget: "under-25" },
      { title: "Camera strap or a compact tripod", reason: "Practical, used on every shoot", budget: "25-75" },
      { title: "Prime lens", reason: "The upgrade that changes their photos", budget: "75-plus" },
    ],
  },
  {
    match: ["plants", "gardening", "flowers", "nature"],
    gifts: [
      { title: "Seed kit for a windowsill herb garden", reason: "Small and immediately useful", budget: "under-25" },
      { title: "A statement houseplant in a nice pot", reason: "Living gift that grows with them", budget: "25-75" },
    ],
  },
  {
    match: ["skincare", "beauty", "fashion", "clothes", "style", "perfume"],
    gifts: [
      { title: "A scented candle or hand cream in their favourite scent", reason: "Small luxury they won't buy themselves", budget: "under-25" },
      { title: "Silk scarf or a piece in their favourite colour", reason: "Use their colour preference as the guide", budget: "25-75" },
      { title: "Signature fragrance", reason: "Personal, and lasts for months", budget: "75-plus" },
    ],
  },
  {
    match: ["movies", "film", "cinema", "series", "tv", "anime"],
    gifts: [
      { title: "Streaming gift card", reason: "Straight into their watchlist", budget: "under-25" },
      { title: "Collector's edition of a favourite film", reason: "Something to display, not just watch", budget: "25-75" },
      { title: "Projector for movie nights", reason: "Turns the living room into a cinema", budget: "75-plus" },
    ],
  },
  {
    match: ["writing", "journaling", "stationery", "notes"],
    gifts: [
      { title: "Fountain pen with a set of inks", reason: "Everyday object made special", budget: "under-25" },
      { title: "Leather-bound journal", reason: "Personalise it with their initials", budget: "25-75" },
    ],
  },
  {
    match: ["board games", "puzzles", "chess", "cards"],
    gifts: [
      { title: "A well-reviewed card game", reason: "Easy to bring to any gathering", budget: "under-25" },
      { title: "Strategy board game", reason: "Something for the next group night", budget: "25-75" },
      { title: "Handmade wooden chess set", reason: "A keepsake, not a shelf-filler", budget: "75-plus" },
    ],
  },
  {
    match: ["tech", "gadgets", "coding", "programming", "computers"],
    gifts: [
      { title: "Braided charging cables and a cable organiser", reason: "Boring and endlessly useful", budget: "under-25" },
      { title: "Power bank or a smart plug set", reason: "Small tech that gets daily use", budget: "25-75" },
      { title: "Noise-cancelling headphones", reason: "Focus gear for long work sessions", budget: "75-plus" },
    ],
  },
];

const FALLBACK_GIFTS: CatalogGift[] = [
  { title: "Handwritten letter with a photo print", reason: "Personal and costs almost nothing", budget: "under-25" },
  { title: "Their favourite snack, boxed up as a hamper", reason: "Use their favourite foods as the shopping list", budget: "25-75" },
  { title: "An experience you do together", reason: "Dinner, a class, a day trip — time over things", budget: "75-plus" },
];

export interface SuggestedGift extends CatalogGift {
  matchedOn: string | null;
}

export function suggestGifts(
  interests: string[],
  extraHints: (string | null | undefined)[] = [],
  budget?: Budget,
): SuggestedGift[] {
  const haystack = [...interests, ...extraHints.filter(Boolean).map(String)]
    .join(" ")
    .toLowerCase();

  const results: SuggestedGift[] = [];
  for (const entry of GIFT_CATALOG) {
    const matched = entry.match.find((keyword) => haystack.includes(keyword));
    if (!matched) continue;
    for (const gift of entry.gifts) {
      if (budget && gift.budget !== budget) continue;
      results.push({ ...gift, matchedOn: matched });
    }
  }

  if (results.length === 0) {
    return FALLBACK_GIFTS.filter((gift) => !budget || gift.budget === budget).map((gift) => ({
      ...gift,
      matchedOn: null,
    }));
  }
  return results.slice(0, 12);
}
