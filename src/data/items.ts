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

export const CARGO_LIMIT = 17;
export const INVENTORY_SLOT_LIMIT = 12;

export const GAME_ITEMS: GameItemDef[] = [
  {
    id: 'meal-pack',
    name: 'Meal Pack',
    cargoCost: 1,
    recommendedQty: 2,
    category: 'consumable',
    shortDesc: 'Freeze-dried crew ration pack.',
    useEffectLabel: '+20 Energy/Stamina',
    usableInInventory: true,
  },
  {
    id: 'water-pack',
    name: 'Water Pack',
    cargoCost: 1,
    recommendedQty: 2,
    category: 'consumable',
    shortDesc: 'Filtered crew drinking pouch.',
    useEffectLabel: '+25 Hydration',
    usableInInventory: true,
  },
  {
    id: 'repair-kit',
    name: 'Repair Kit',
    cargoCost: 2,
    recommendedQty: 1,
    category: 'repair',
    shortDesc: 'Multi-tool set for solar and power array fixes.',
    useEffectLabel: 'Required for Solar Array Plan A',
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
    useEffectLabel: 'Assists Circuit Reconnect repairs',
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
    useEffectLabel: '+20 Health',
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
    name: 'Radiation Shielding Panel',
    cargoCost: 2,
    recommendedQty: 1,
    category: 'shielding',
    shortDesc: 'Hydrogen-rich composite shelter shield plate.',
    useEffectLabel: '+20 Radiation Protection',
    usableInInventory: true,
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
