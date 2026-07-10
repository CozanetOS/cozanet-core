import { CEO } from "../CEO/ceo";

export interface ReasoningResult {
  answer: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class ReasoningEngine {
  public readonly id = "reasoning";

  constructor() {
    CEO.getInstance().registerEngine({
      id: this.id,
      name: "Reasoning Engine",
      description: "Provides LLM reasoning using Groq's Llama3 engine.",
      handler: async (payload: any) => {
        return await this.reason(payload.context || "", payload.question || "");
      }
    });
  }

  public async reason(context: string, question: string): Promise<ReasoningResult> {
    const apiKey = process.env.GROQ_API_KEY_1;
    if (!apiKey) {
      console.warn("GROQ_API_KEY_1 is not set. Falling back to local placeholder reasoning.");
      return {
        answer: `[Fallback Response] Based on the context: "${context}", to answer "${question}": CozanetOS Reasoning fallback execution. Set GROQ_API_KEY_1 for live reasoning.`,
        model: "offline-fallback"
      };
    }

    const messages = [
      { role: "system", content: "You are the reasoning engine of CozanetOS. Synthesize a logical response based on the provided context." },
      { role: "user", content: `Context: ${context}\n\nQuestion: ${question}` }
    ];

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama3-70b-8192",
          messages: messages,
          temperature: 0.2
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      return {
        answer: data.choices[0].message.content,
        model: "llama3-70b-8192",
        usage: data.usage
      };
    } catch (error: any) {
      console.error("Reasoning Engine Groq Call Failed:", error);
      throw error;
    }
  }
}
