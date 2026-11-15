export type ItemCategory = 'consumable' | 'repair' | 'emergency' | 'shielding';

export type GameItemDef = {
  id: string;
  name: string;
  cargoCost: number;
  recommendedQty: number;
  category: ItemCategory;
  shortDesc: string;
  useEffectLabel: string;
  usableInInventory: boolean;
};

export type AssemblyRecipe = {
  id: string;
  outputItemId: string;
  outputName: string;
  description: string;
  ingredients: { itemId: string; qty: number }[];
};

export const CARGO_LIMIT = 17;
export const INVENTORY_SLOT_LIMIT = 12;
export const SHARED_FOOD_CAPACITY = 24;

export const FOOD_ITEM_IDS = ['fresh-crop', 'meal-pack'] as const;
export const LOCKER_STORABLE_IDS = ['fresh-crop', 'meal-pack', 'water-pack'] as const;

export function isFoodItem(itemId: string): boolean {
  return itemId === 'fresh-crop' || itemId === 'meal-pack';
}

export function isLockerStorable(itemId: string): boolean {
  return itemId === 'fresh-crop' || itemId === 'meal-pack' || itemId === 'water-pack';
}

export const GAME_ITEMS: GameItemDef[] = [
  {
    id: 'fresh-crop',
    name: 'Fresh Harvest',
    cargoCost: 1,
    recommendedQty: 0,
    category: 'consumable',
    shortDesc: 'Crisp hydroponic greens & tubers harvested from the Greenhouse.',
    useEffectLabel: '+28 Nutrition (stamina recovers gradually)',
    usableInInventory: true,
  },
  {
    id: 'meal-pack',
    name: 'Meal Pack',
    cargoCost: 1,
    recommendedQty: 2,
    category: 'consumable',
    shortDesc: 'Freeze-dried crew ration pack.',
    useEffectLabel: '+24 Nutrition (gradually restores stamina)',
    usableInInventory: true,
  },
  {
    id: 'water-pack',
    name: 'Water Pack',
    cargoCost: 1,
    recommendedQty: 2,
    category: 'consumable',
    shortDesc: 'Filtered crew drinking pouch.',
    useEffectLabel: '+25 Hydration & +6 Potable Water',
    usableInInventory: true,
  },
  {
    id: 'repair-kit',
    name: 'Repair Kit',
    cargoCost: 2,
    recommendedQty: 1,
    category: 'repair',
    shortDesc: 'Multi-tool set for solar, thermal, and power array fixes.',
    useEffectLabel: 'Restores +35% machine condition or solves Plan A repairs',
    usableInInventory: false,
  },
  {
    id: 'spare-co2-filter',
    name: 'Spare CO₂ Filter',
    cargoCost: 2,
    recommendedQty: 1,
    category: 'repair',
    shortDesc: 'Replacement lithium hydroxide air cartridge.',
    useEffectLabel: 'Required for CO₂ Scrubber Plan A',
    usableInInventory: false,
  },
  {
    id: 'cable-connector-kit',
    name: 'Cable Connector Kit',
    cargoCost: 1,
    recommendedQty: 1,
    category: 'repair',
    shortDesc: 'Color-coded low-voltage harness connectors.',
    useEffectLabel: 'Assists Circuit Reconnect & electrical repairs',
    usableInInventory: false,
  },
  {
    id: 'hull-patch-kit',
    name: 'Hull Patch Kit',
    cargoCost: 1,
    recommendedQty: 1,
    category: 'repair',
    shortDesc: 'Composite pressure seal patch for hull breaches.',
    useEffectLabel: 'Required for Pressure Leak Plan A',
    usableInInventory: false,
  },
  {
    id: 'medical-kit',
    name: 'Medical Kit',
    cargoCost: 1,
    recommendedQty: 1,
    category: 'consumable',
    shortDesc: 'First-aid kit for astronaut recovery.',
    useEffectLabel: '+20 Crew Health',
    usableInInventory: true,
  },
  {
    id: 'emergency-battery',
    name: 'Emergency Battery Module',
    cargoCost: 2,
    recommendedQty: 1,
    category: 'emergency',
    shortDesc: 'Portable high-density reserve power cell.',
    useEffectLabel: '+25 Battery Reserve',
    usableInInventory: true,
  },
  {
    id: 'emergency-oxygen',
    name: 'Emergency Oxygen Reserve',
    cargoCost: 2,
    recommendedQty: 1,
    category: 'emergency',
    shortDesc: 'Pressurized backup O₂ canister.',
    useEffectLabel: '+25 Oxygen Reserve',
    usableInInventory: true,
  },
  {
    id: 'radiation-panel',
    name: 'Consumable Radiation Liner',
    cargoCost: 2,
    recommendedQty: 1,
    category: 'shielding',
    shortDesc: 'Deployable consumable polyethylene radiation-absorbing liner for solar storms.',
    useEffectLabel: '+20 Storm Shielding Bonus (consumable)',
    usableInInventory: true,
  },
  {
    id: 'spare-parts',
    name: 'Spare Hardware & Sealant',
    cargoCost: 1,
    recommendedQty: 0,
    category: 'repair',
    shortDesc: 'Salvaged aerospace brackets, gaskets, and sealant strips found on outpost.',
    useEffectLabel: 'Combine in Bag to assemble Repair or Patch Kits',
    usableInInventory: false,
  },
];

export const ASSEMBLY_RECIPES: AssemblyRecipe[] = [
  {
    id: 'craft-repair-kit',
    outputItemId: 'repair-kit',
    outputName: 'Repair Kit',
    description: 'Assemble a field repair kit from salvaged hardware and cable connectors.',
    ingredients: [
      { itemId: 'spare-parts', qty: 1 },
      { itemId: 'cable-connector-kit', qty: 1 },
    ],
  },
  {
    id: 'craft-hull-patch',
    outputItemId: 'hull-patch-kit',
    outputName: 'Hull Patch Kit',
    description: 'Shape emergency sealant and hardware into a composite pressure patch.',
    ingredients: [{ itemId: 'spare-parts', qty: 2 }],
  },
  {
    id: 'craft-co2-filter',
    outputItemId: 'spare-co2-filter',
    outputName: 'Spare CO₂ Filter',
    description: 'Assemble an improvised air-filter cartridge using Apollo-style sealant & hardware.',
    ingredients: [
      { itemId: 'spare-parts', qty: 1 },
      { itemId: 'radiation-panel', qty: 1 },
    ],
  },
];

export const ITEM_BY_ID: Record<string, GameItemDef> = Object.fromEntries(
  GAME_ITEMS.map((item) => [item.id, item])
);

export function getRecommendedLoadout(): Record<string, number> {
  const rec: Record<string, number> = {};
  for (const item of GAME_ITEMS) {
    rec[item.id] = item.recommendedQty;
  }
  return rec;
}
