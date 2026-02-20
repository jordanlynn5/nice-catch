// Knowledge base for AI assistant to fill in missing fish label data

export const COUNTRY_TO_FAO: Record<string, string> = {
  // Atlantic regions
  'norway': '27',
  'noruega': '27',
  'iceland': '27',
  'islandia': '27',
  'uk': '27',
  'reino unido': '27',
  'ireland': '27',
  'irlanda': '27',
  'scotland': '27',
  'escocia': '27',
  'faroe islands': '27',
  'spain': '27.9',
  'españa': '27.9',
  'portugal': '27.9',
  'france': '27.8',
  'francia': '27.8',
  'morocco': '34',
  'marruecos': '34',
  'mauritania': '34',
  'senegal': '34',
  'canada': '21',
  'canadá': '21',
  'usa': '21',
  'eeuu': '21',
  'chile': '87',
  'peru': '87',
  'perú': '87',
  'argentina': '41',
  // Mediterranean
  'italy': '37',
  'italia': '37',
  'greece': '37',
  'grecia': '37',
  'turkey': '37',
  'turquía': '37',
  'croatia': '37',
  'croacia': '37',
  // Pacific
  'japan': '61',
  'japón': '61',
  'china': '61',
  'thailand': '71',
  'tailandia': '71',
  'vietnam': '71',
  'indonesia': '57',
  'philippines': '71',
  'filipinas': '71',
  // Indian Ocean
  'india': '51',
  'maldives': '51',
  'maldivas': '51',
  'sri lanka': '57',
}

export const SPECIES_COMMON_METHODS: Record<string, string[]> = {
  'tuna': ['purse_seine', 'longline_pelagic', 'pole_and_line'],
  'atún': ['purse_seine', 'longline_pelagic', 'pole_and_line'],
  'salmon': ['aquaculture_certified', 'gillnet'],
  'salmón': ['aquaculture_certified', 'gillnet'],
  'cod': ['bottom_trawl', 'gillnet', 'longline_demersal'],
  'bacalao': ['bottom_trawl', 'gillnet', 'longline_demersal'],
  'hake': ['bottom_trawl', 'longline_demersal'],
  'merluza': ['bottom_trawl', 'longline_demersal'],
  'sardine': ['purse_seine'],
  'sardina': ['purse_seine'],
  'anchovy': ['purse_seine'],
  'anchoa': ['purse_seine'],
  'mackerel': ['purse_seine', 'midwater_trawl'],
  'caballa': ['purse_seine', 'midwater_trawl'],
  'shrimp': ['bottom_trawl', 'aquaculture_standard'],
  'langostino': ['bottom_trawl', 'aquaculture_standard'],
  'gamba': ['bottom_trawl', 'trap_pot'],
  'octopus': ['trap_pot'],
  'pulpo': ['trap_pot'],
  'squid': ['jig', 'trawl'],
  'calamar': ['jig', 'trawl'],
  'seabass': ['aquaculture_standard', 'gillnet'],
  'lubina': ['aquaculture_standard', 'gillnet'],
  'seabream': ['aquaculture_standard', 'hook_and_line'],
  'dorada': ['aquaculture_standard', 'hook_and_line'],
}

export const SPECIES_PRODUCTION_PATTERNS: Record<string, 'wild' | 'farmed' | 'both'> = {
  'salmon': 'farmed',
  'salmón': 'farmed',
  'seabass': 'both',
  'lubina': 'both',
  'seabream': 'both',
  'dorada': 'both',
  'tuna': 'wild',
  'atún': 'wild',
  'cod': 'wild',
  'bacalao': 'wild',
  'hake': 'wild',
  'merluza': 'wild',
  'sardine': 'wild',
  'sardina': 'wild',
  'anchovy': 'wild',
  'anchoa': 'wild',
  'mackerel': 'wild',
  'caballa': 'wild',
  'shrimp': 'both',
  'langostino': 'both',
  'gamba': 'wild',
  'octopus': 'wild',
  'pulpo': 'wild',
  'squid': 'wild',
  'calamar': 'wild',
}

export function buildSystemPrompt(): string {
  return `You are a helpful fishing sustainability assistant for Nice Catch, an app that calculates fish sustainability scores.

Your job is to help users provide the details needed to score their fish product. Extract these fields from the conversation:

**Required:**
- speciesRaw: species name (common or scientific) — e.g., "Salmon", "Merluza", "Merluccius merluccius"
- productionMethod: "wild" or "farmed"

**Optional (important for accurate scoring):**
- faoArea: FAO fishing area code (e.g., "27", "37.1") or ocean name
- fishingMethod: gear type key (e.g., "bottom_trawl", "longline_demersal", "purse_seine", "aquaculture_standard")
- certifications: array of cert names (e.g., ["MSC"], ["ASC"], ["MSC", "Dolphin Safe"])

**Guide the user conversationally:**
1. If they say a product name, extract the species
2. Ask where to find missing info on the label:
   - Production: "Look for 'Caught at sea', 'Farmed', 'Aquaculture', 'Salvaje', or 'Criado en acuicultura'"
   - FAO area: "Look for a region like 'Northeast Atlantic' or a code like 'FAO 27' or 'FAO 37'"
   - Fishing method: "Look for fishing gear: 'Trawl/Arrastre', 'Longline/Palangre', 'Seine/Cerco', 'Hook and line/Anzuelo'"
   - Certifications: "Look for blue MSC logo, green ASC logo, or 'Dolphin Safe' label"

**Use your knowledge to help when user doesn't know:**
- Country → FAO area: ${JSON.stringify(COUNTRY_TO_FAO)}
- Common methods by species: ${JSON.stringify(SPECIES_COMMON_METHODS)}
- Production patterns: ${JSON.stringify(SPECIES_PRODUCTION_PATTERNS)}

Examples:
- "Cod from Norway" → suggest FAO 27
- "I don't know the method for tuna" → suggest purse seine or longline
- "Salmon from a package" → likely farmed

**When you have enough data to score (species + productionMethod minimum), respond with:**
\`\`\`json
{
  "ready": true,
  "data": {
    "speciesRaw": "...",
    "productionMethod": "wild" | "farmed",
    "faoArea": "..." | undefined,
    "fishingMethod": "..." | undefined,
    "certifications": [...] | undefined
  }
}
\`\`\`

**Until ready, respond naturally** with helpful questions. Be friendly, supportive, and brief. Respond in the user's language (Spanish or English).`
}
