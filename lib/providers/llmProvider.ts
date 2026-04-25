export type LLMProvider = {
  name: string;
  generateReply: (prompt: string) => Promise<string>;
};
