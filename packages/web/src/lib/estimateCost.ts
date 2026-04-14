interface CostInput {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

type PricingEntry = { input: number; output: number };

const PRICING_PER_MILLION: Record<string, Record<string, PricingEntry>> = {
  anthropic: {
    "claude-sonnet-4": { input: 3.0, output: 15.0 },
    "claude-opus-4": { input: 15.0, output: 75.0 },
    "claude-haiku-3.5": { input: 0.8, output: 4.0 },
  },
  openai: {
    "gpt-4o": { input: 2.5, output: 10.0 },
    "gpt-4o-mini": { input: 0.15, output: 0.6 },
    "o3": { input: 10.0, output: 40.0 },
  },
  google: {
    "gemini-2.5-pro": { input: 1.25, output: 10.0 },
    "gemini-2.5-flash": { input: 0.15, output: 0.6 },
  },
};

const DEFAULT_PRICING: PricingEntry = { input: 3.0, output: 15.0 };

function lookupPricing(provider: string, model: string): PricingEntry {
  return PRICING_PER_MILLION[provider]?.[model] ?? DEFAULT_PRICING;
}

export function estimateCost(input: CostInput): number {
  const pricing = lookupPricing(input.provider, input.model);
  const inputCost = (input.inputTokens / 1_000_000) * pricing.input;
  const outputCost = (input.outputTokens / 1_000_000) * pricing.output;
  return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000;
}

export function formatCost(dollars: number): string {
  if (dollars < 0.01) {
    return `$${(dollars * 100).toFixed(3)}¢`.replace("$", "");
  }
  return `$${dollars.toFixed(4)}`;
}
