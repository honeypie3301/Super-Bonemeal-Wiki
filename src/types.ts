export interface WikiArticle {
  slug: string;
  title: string;
  category: string;
  order: number;
  description: string;
  isUpdated?: boolean;
}

export interface RecipeSlot {
  code: string; // e.g. "Bb" or "Sbm"
  name: string; // e.g. "Bone Block"
  bgColor?: string; // custom slot color if needed
  textColor?: string;
}

export interface RecipeSpec {
  id: string;
  type: 'CRAFTING SHAPED' | 'CRAFTING SHAPELESS';
  title: string;
  yieldCount: number;
  recipeNumber?: string;
  recipeFile: string;
  grid: (RecipeSlot | null)[]; // 9 slots
  output: RecipeSlot & { count: number };
  ingredientsList: { key: string; name: string }[];
}

export interface TradeSpec {
  profession: string;
  level: number;
  levelTitle: string;
  cost: {
    item: string;
    count: number;
    icon: string;
  };
  result: {
    item: string;
    count: number;
    icon: string;
  };
  maxTrades: number;
  xpGain: number;
  priceMultiplier: number;
}
