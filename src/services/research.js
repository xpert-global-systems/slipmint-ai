// slipmint-ai/src/services/research.js

import { OpenAI } from 'openai';
import { env } from '../config/env.js';

// Instantiate client securely utilizing your centralized config layout
const openai = new OpenAI({ 
  apiKey: env.openaiApiKey 
});

/**
 * Executes a deep research operation utilizing Tavily agentic search
 * and synthesizes the results using an OpenAI reasoning layout.
 */
export async function generateDeepResearch(query) {
  try {
    // 1. Fetch live market contextual data from Tavily Advanced Search
    const searchResponse = await fetch('https://tavily.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: env.tavilyApiKey,
        query: query,
        search_depth: 'advanced',
        max_results: 5
      })
    });

    if (!searchResponse.ok) {
      throw new Error(`Tavily search extraction failed: ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();

    // 2. Synthesize with OpenAI to output structured markdown
    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are the SlipMint Professional Intelligence Agent. Synthesize raw web search data into an expert-level, actionable financial/crypto research summary. Always reference sources explicitly.'
        },
        {
          role: 'user',
          content: `User Research Request: ${query}\n\nRaw Search Context Data:\n${JSON.stringify(searchData.results)}`
        }
      ],
      temperature: 0.2
    });

    return {
      success: true,
      query,
      answer: aiResponse.choices.message.content,
      sources: searchData.results.map(r => ({ title: r.title, url: r.url }))
    };

  } catch (error) {
    console.error('[slipmint-ai] Deep Search Service Error:', error);
    return { success: false, error: error.message };
  }
}
