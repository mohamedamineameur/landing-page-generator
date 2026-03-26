declare module "openai" {
  export default class OpenAI {
    constructor(options: { apiKey?: string });
    chat: {
      completions: {
        create(options: {
          model: string;
          temperature?: number;
          response_format?: { type: string };
          messages: Array<{ role: string; content: string }>;
        }): Promise<unknown>;
      };
    };
    images: {
      generate(options: {
        model: string;
        prompt: string;
        size?: string;
      }): Promise<{
        data: Array<{
          b64_json?: string;
        }>;
      }>;
    };
  }
}
