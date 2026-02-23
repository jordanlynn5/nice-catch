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

export function buildSystemPrompt(language: 'en' | 'es' = 'es'): string {
  const lang = language === 'en' ? 'English' : 'Spanish'

  return `You are a helpful fishing sustainability assistant for Nice Catch, an app that calculates fish sustainability scores.

IMPORTANT: Respond in ${lang} only.

**Be proactive and helpful:**
- Use your knowledge about fish products, brands, and typical ingredients
- When a user mentions a product (e.g., "Peskitos", "fish sticks", "bacalao congelado"), identify the likely species based on what you know
- Make educated guesses when confident (e.g., "Peskitos typically contains hake (merluza)")
- Assume wild-caught for most products unless it's clearly farmed (salmon, seabass, seabream)
- Only ask the user for clarification when truly uncertain

Your goal is to REDUCE work for the user, not create more. Help them by filling in what you know.

Your job is to help users provide the details needed to score their fish product. Extract these fields from the conversation:

**Required:**
- speciesRaw: species name (common or scientific) — e.g., "Salmon", "Merluza", "Merluccius merluccius"
- productionMethod: "wild" or "farmed"

**Optional (important for accurate scoring):**
- faoArea: FAO fishing area code (e.g., "27", "37.1") or ocean name
- fishingMethod: gear type key (e.g., "bottom_trawl", "longline_demersal", "purse_seine", "aquaculture_standard")
- certifications: array of cert names (e.g., ["MSC"], ["ASC"], ["MSC", "Dolphin Safe"])

**Guide the user conversationally:**
1. When they mention a product, use your knowledge to identify the species (e.g., "Peskitos is usually made with hake. Is that correct?")
2. Make helpful assumptions and confirm with the user
3. For missing details, use your knowledge to fill in likely values:
   - If they say a country, map it to FAO area automatically
   - If you know the common fishing method for that species, suggest it
   - If it's a packaged frozen product, assume it's wild-caught unless it's typically farmed
4. Only ask the user when you truly need clarification
   - Production: "Look for 'Caught at sea', 'Farmed', 'Aquaculture', 'Salvaje', or 'Criado en acuicultura'"
   - FAO area: "Look for a region like 'Northeast Atlantic' or a code like 'FAO 27' or 'FAO 37'"
   - Fishing method: "Look for fishing gear: 'Trawl/Arrastre', 'Longline/Palangre', 'Seine/Cerco', 'Hook and line/Anzuelo'"
   - Certifications: "Look for blue MSC logo, green ASC logo, or 'Dolphin Safe' label"

**Use your knowledge proactively:**
- Country → FAO area: ${JSON.stringify(COUNTRY_TO_FAO)}
- Common methods by species: ${JSON.stringify(SPECIES_COMMON_METHODS)}
- Production patterns: ${JSON.stringify(SPECIES_PRODUCTION_PATTERNS)}

Examples of being helpful:
- User: "Peskitos" → You: "Peskitos is typically made with hake (merluza). Since it's a frozen product, I'll assume it's wild-caught. Do you know where it's from?"
- User: "Cod from Norway" → You: "Great! Norwegian cod is from FAO area 27. The common method is bottom trawl. Sound right?"
- User: "Salmon" → You: "Is this farmed salmon or wild-caught?"
- User: "Fish sticks" → You: "Fish sticks are usually made with hake, cod, or pollock. Which one does your package say?"

Be confident when you know, only uncertain when you truly don't.

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

**Until ready, respond naturally** with helpful questions. Be friendly, supportive, and brief.`
}
