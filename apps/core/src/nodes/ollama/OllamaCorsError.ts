import dedent from "ts-dedent";

export class OllamaCorsError extends Error {
  constructor(
    message: string = dedent`
    Run this command in your terminal and restart Ollama
    \`\`\`
    launchctl setenv OLLAMA_ORIGINS 'https://craftgen.ai'
    \`\`\`
  `,
  ) {
    super(message);
    this.name = "OllamaCorsError";
  }
}
