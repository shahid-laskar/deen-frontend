export type ThemeId = 
  | "madinah-dawn" | "midnight-tahajjud" | "emerald-rawdah" | "ottoman-royal" 
  | "andalusian-azure" | "desert-rose" | "olive-grove" | "saffron-bazaar"
  | "sahara-minimal" | "nordic-masjid" | "linear-graphite" | "vercel-mono" 
  | "paper-scholar" | "mist-ink" | "obsidian-gold" | "pearl-mushaf"
  | "platinum-silk" | "velvet-amethyst" | "cherry-blossom-iftar" | "ocean-tasbih"
  | "mountain-fajr" | "autumn-maghrib" | "spring-rayhan" | "winter-sakina";

export type MotifId = "rub-el-hizb" | "zellige" | "lattice" | "kufic" | "star-8" | "arabesque" | "quatrefoil" | "hex";
export type IconPackId = "lucide" | "lucide-filled" | "phosphor" | "phosphor-duotone";
export type TypeSetId = "classic" | "editorial" | "royal" | "modern" | "geometric" | "soft";
export type Mode = "light" | "dark" | "system";

export interface Theme {
  id: ThemeId; 
  name: string; 
  tagline: string;
  category: "traditional" | "modern" | "luxury" | "nature";
  swatches: [string, string, string, string];
  motif: MotifId; 
  icons: IconPackId; 
  typeset: TypeSetId;
  preferredMode?: "light" | "dark";
}

export const THEMES: Theme[] = [
  // 1-8 Traditional
  { id: "madinah-dawn", name: "Madinah Dawn", tagline: "Warm amber sunrise over the Prophet's Mosque", category: "traditional", swatches: ["#D4A574", "#F5EDE0", "#8BA888", "#B8844F"], motif: "rub-el-hizb", icons: "lucide", typeset: "classic" },
  { id: "midnight-tahajjud", name: "Midnight Tahajjud", tagline: "Indigo night + moonlight gold", category: "traditional", swatches: ["#3B3A7E", "#1A1B3A", "#E8D78C", "#C0C8E0"], motif: "star-8", icons: "phosphor-duotone", typeset: "editorial", preferredMode: "dark" },
  { id: "emerald-rawdah", name: "Emerald Rawdah", tagline: "Deep emerald + antique gold + ivory", category: "traditional", swatches: ["#1F6E4A", "#F4EFE0", "#C9A248", "#7BA88C"], motif: "arabesque", icons: "lucide", typeset: "royal" },
  { id: "ottoman-royal", name: "Ottoman Royal", tagline: "Burgundy + teal + brass + cream", category: "traditional", swatches: ["#7A1E2E", "#F5E9D0", "#C69A4A", "#2E5E6E"], motif: "kufic", icons: "phosphor-duotone", typeset: "royal" },
  { id: "andalusian-azure", name: "Andalusian Azure", tagline: "Moorish cobalt + ochre + zellige white", category: "traditional", swatches: ["#1E4FB8", "#F0F4F8", "#C89340", "#3FA3A3"], motif: "zellige", icons: "phosphor", typeset: "royal" },
  { id: "desert-rose", name: "Desert Rose", tagline: "Dusty rose + terracotta + sand + muted teal", category: "traditional", swatches: ["#C87A7A", "#F7E6D8", "#D4A574", "#7FA8A8"], motif: "quatrefoil", icons: "phosphor", typeset: "soft" },
  { id: "olive-grove", name: "Olive Grove", tagline: "Olive + wheat + terracotta + warm beige", category: "traditional", swatches: ["#6B7A3E", "#F0E6CE", "#C08855", "#D4C28A"], motif: "lattice", icons: "lucide", typeset: "classic" },
  { id: "saffron-bazaar", name: "Saffron Bazaar", tagline: "Saffron + indigo + rose + cream", category: "traditional", swatches: ["#E8974A", "#F6EBD8", "#5A4B8E", "#C04858"], motif: "arabesque", icons: "lucide", typeset: "editorial" },
  
  // 9-14 Modern
  { id: "sahara-minimal", name: "Sahara Minimal", tagline: "Off-white + graphite + single saffron accent", category: "modern", swatches: ["#FAFAF7", "#1A1A1A", "#E88B2C", "#8A8A85"], motif: "hex", icons: "lucide", typeset: "modern" },
  { id: "nordic-masjid", name: "Nordic Masjid", tagline: "Fjord slate + matte gold + chalk", category: "modern", swatches: ["#5A7A94", "#EEF2F4", "#B89358", "#8FA8B5"], motif: "lattice", icons: "phosphor", typeset: "modern" },
  { id: "linear-graphite", name: "Linear Graphite", tagline: "Pure neutrals + electric violet accent", category: "modern", swatches: ["#FCFCFC", "#0F0F10", "#7C5CFF", "#6E6E72"], motif: "hex", icons: "lucide", typeset: "geometric" },
  { id: "vercel-mono", name: "Vercel Mono", tagline: "Black/white + single cyan accent", category: "modern", swatches: ["#FFFFFF", "#000000", "#0070F3", "#888888"], motif: "hex", icons: "lucide", typeset: "modern" },
  { id: "paper-scholar", name: "Paper Scholar", tagline: "Warm paper + sepia ink + oxblood", category: "modern", swatches: ["#F2EADA", "#3A2E24", "#8A3A2E", "#B89968"], motif: "kufic", icons: "phosphor", typeset: "editorial" },
  { id: "mist-ink", name: "Mist Ink", tagline: "Soft grey-blue + deep ink + blush", category: "modern", swatches: ["#E8ECEF", "#2A2F3A", "#C88B8B", "#6B7A94"], motif: "lattice", icons: "phosphor", typeset: "geometric" },
  
  // 15-18 Luxury
  { id: "obsidian-gold", name: "Obsidian Gold", tagline: "Near-black + 24k gold + ivory", category: "luxury", swatches: ["#0A0A08", "#D4AF37", "#F5F1E6", "#4A4842"], motif: "star-8", icons: "phosphor-duotone", typeset: "royal", preferredMode: "dark" },
  { id: "pearl-mushaf", name: "Pearl Mushaf", tagline: "Pearl + rose-gold + blush + plum", category: "luxury", swatches: ["#F7EDEE", "#7A3E5E", "#D4A38C", "#E8C5BC"], motif: "quatrefoil", icons: "phosphor-duotone", typeset: "soft" },
  { id: "platinum-silk", name: "Platinum Silk", tagline: "Platinum + champagne + soft mauve", category: "luxury", swatches: ["#E6E4DE", "#8C7A5E", "#B8A890", "#6E5E7E"], motif: "arabesque", icons: "lucide", typeset: "royal" },
  { id: "velvet-amethyst", name: "Velvet Amethyst", tagline: "Deep purple + champagne gold + cream", category: "luxury", swatches: ["#3E1E5E", "#F2E8D8", "#D4AF37", "#8E6EAE"], motif: "star-8", icons: "phosphor-duotone", typeset: "royal" },
  
  // 19-24 Nature
  { id: "cherry-blossom-iftar", name: "Cherry Blossom Iftar", tagline: "Sakura + matcha + cream + plum", category: "nature", swatches: ["#F0A3B8", "#FDF4F0", "#8FB88C", "#6E3757"], motif: "quatrefoil", icons: "phosphor", typeset: "soft" },
  { id: "ocean-tasbih", name: "Ocean Tasbih", tagline: "Ocean blue + foam + coral + deep teal", category: "nature", swatches: ["#1E6E8E", "#E8F2F4", "#E88B6E", "#0E3E5A"], motif: "lattice", icons: "phosphor", typeset: "modern" },
  { id: "mountain-fajr", name: "Mountain Fajr", tagline: "Misty blue + pine + granite + snow", category: "nature", swatches: ["#5A7A8E", "#F0F2F0", "#3E5E4A", "#8E9AA0"], motif: "hex", icons: "lucide", typeset: "geometric" },
  { id: "autumn-maghrib", name: "Autumn Maghrib", tagline: "Burnt orange + deep red + mustard + brown", category: "nature", swatches: ["#C85A2E", "#8E2E1E", "#D4A238", "#5A3A24"], motif: "arabesque", icons: "phosphor", typeset: "editorial" },
  { id: "spring-rayhan", name: "Spring Rayhan", tagline: "Fresh green + lemon + sky + cream", category: "nature", swatches: ["#4A9E6E", "#F8F4D8", "#7EB8E8", "#E8D458"], motif: "quatrefoil", icons: "lucide", typeset: "soft" },
  { id: "winter-sakina", name: "Winter Sakina", tagline: "Icy blue + silver + slate + snow", category: "nature", swatches: ["#B8CEDE", "#E8EEF2", "#5E7A8E", "#2E3E4E"], motif: "star-8", icons: "phosphor", typeset: "modern" },
];
