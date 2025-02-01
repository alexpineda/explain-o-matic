# Explain-o-matic 🤖🔊

_Voice-guided code walkthroughs. Great for LLM-generated code. Quickly grok what the code is about with high level summaries. Break down sections to get more details._

![](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![](https://img.shields.io/badge/VSCode-007ACC?logo=visualstudiocode&logoColor=white)

![CleanShot 2025-01-31 at 09 47 44](https://github.com/user-attachments/assets/d4195697-2710-496d-97b6-b559104d9dfa)

## Features

- 🎙️ **AI-Powered Code Breakdown & Voice Explanations**  
  Automatically splits code changes into logical sections and speaks summaries using your OS's native TTS (no API needed).
- **Smart Navigation**  
  Jump between sections with status bar controls and navigator, breakdown sections further by right clicking.
  ![CleanShot 2025-01-31 at 09 48 25](https://github.com/user-attachments/assets/ee6b2830-02ec-45bb-839f-4e69f05a7256)

- 🧠 **Supports reasoning models for smarter summaries**

---

⚠️ **Experimental Warning**

This extension is experimental and not all features are available.

- ✅ Tested on macOS Sequoia
- ✅ Tested on Windows 11
- ⚠️ TTS not tested on Linux

## Install

### Marketplace
![icon](https://github.com/user-attachments/assets/ab0edc7a-f260-4b91-8182-feb866c85fe5)

[Download from Marketplace](https://marketplace.visualstudio.com/items?itemName=weloveoov.explain-o-matic)

### From VSIX

```bash
code --install-extension explain-o-matic-1.0.0.vsix
```

## Usage

1. Run `Explain-o-matic: Start Review` from command palette
2. Use these controls:
   - `Next Section` → Status bar → (or `Explain-o-matic: Next Section` from command palette)
   - `Stop Review` → Status bar ⬛ (or `Explain-o-matic: Stop Review` from command palette)
3. Click sections in side panel to jump
4. Right click sections in side panel to breakdown sections (or `Explain-o-matic: Breakdown Section` from command palette)

## Configure LLMs

Add to settings.json:

```json
"explainomatic.llm": {
    "reasoner": {
        "provider": "deepseek",
        "model": "deepseek-reasoning",
        "apiKey": "sk-your-key-here (or we read from ENV)",
    },
    "sectioner": {
        "provider": "anthropic",
        "model": "claude-3-5-sonnet-20240620",
        "apiKey": "sk-your-key-here (or we read from ENV)",
        "temperature": 0.1
    }
}
```

If reasoner is enabled, it will be used to analyze the code and pass on it's output to the codeReviewer. Meant for models that expose their reasoning process only. Useful in getting better breakdowns.

The code reviewer breaks up the code into sections.

## Supported LLM Providers

- [x] DeepSeek `deepseek`
- [x] OpenAI `openai`
- [ ] Google Vertex `vertex`
- [x] Anthropic `anthropic`
- [x] XAI `xai`
- [x] Groq `groq`
- [ ] OpenAI Compatible `openai-compatible`

Feel free to add more providers. We're just wrapping the [Vercel AI SDK](https://sdk.vercel.ai/providers/ai-sdk-providers).

## Troubleshooting and more options

**No Speech?**

- Linux: Install `espeak`
  ```bash
  sudo apt-get install espeak
  ```

**No API Key?**

- Set `explainomatic.useEnvKeys` to true to read from your environment variables as well as the settings.json

**Large Files?**

> Add warning threshold to settings:

**Other Options**

- `explainomatic.fileSizeWarning: 500` modify the large file size warning threshold
- `explainomatic.useReasoner: true/false` to enable/disable the reasoner
- `explainomatic.showStatusBarButtons: true/false` to show/hide the status bar buttons

---

## Future plans

- [ ] Add more LLM providers
- [ ] Support for local LLMs
- [ ] GUI for configuration
- [ ] Support for Github Copilot API

## Maybe

- [ ] Support for additional context from imported files
- [ ] Other voice options (OpenAI)

## Author

[@weloveoov](weloveoov.com)

📜 **License**  
MIT © 2025
