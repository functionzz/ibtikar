const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeResponse {
  content: Array<{ type: string; text: string }>;
  model: string;
  usage: { input_tokens: number; output_tokens: number };
}

interface CategorizationResult {
  category: 'normal' | 'wasteful';
  reason?: string;
}

// // Get API key from storage
// export async function getApiKey(): Promise<string | null> {
//   return new Promise((resolve) => {
//     chrome.storage.local.get(['claudeApiKey'], (result) => {
//       resolve(result.claudeApiKey || null);
//     });
//   });
// }

// // Save API key to storage
// export async function saveApiKey(apiKey: string): Promise<void> {
//   return new Promise((resolve) => {
//     chrome.storage.local.set({ claudeApiKey: apiKey }, resolve);
//   });
// }

// Make a request to Claude API
export async function sendMessage(
  messages: ClaudeMessage[],
  options?: { maxTokens?: number; model?: string }
): Promise<string> {
  const apiKey = process.env.CLAUDE_API_KEY || '';

  if (!apiKey) {
    throw new Error('Claude API key not configured');
  }

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: options?.model || 'claude-sonnet-4-20250514',
      max_tokens: options?.maxTokens || 256,
      messages,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${error}`);
  }

  const data: ClaudeResponse = await response.json();
  return data.content[0]?.text || '';
}

// Categorize a purchase as normal or wasteful
export async function categorizePurchase(
  productName: string,
  price?: number
): Promise<CategorizationResult> {
  const prompt = `You are a purchase categorization assistant. Categorize this product as either "normal" (essentials like toiletries, groceries, household necessities, cleaning supplies, medicine, basic clothing) or "wasteful" (impulse purchases like entertainment, luxury items, hobbies, collectibles, gaming, electronics upgrades, designer items, cosmetics beyond basics).

Product: ${productName}${price ? ` ($${price})` : ''}

Be strict: when in doubt, categorize as wasteful.

Respond with ONLY valid JSON:
{"category": "normal", "reason": "brief reason"} or {"category": "wasteful", "reason": "brief reason"}`;

  try {
    const response = await sendMessage([{ role: 'user', content: prompt }]);
    const result = JSON.parse(response.trim());

    if (result.category === 'normal' || result.category === 'wasteful') {
      return result as CategorizationResult;
    }

    // Default to wasteful if unexpected response
    return { category: 'wasteful', reason: 'Unable to categorize' };
  } catch (error) {
    console.error('Categorization error:', error);
    // Fail safe: treat as wasteful
    return { category: 'wasteful', reason: 'Error during categorization' };
  }
}

// Check if API key is valid
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    });

    return response.ok;
  } catch {
    return false;
  }
}
