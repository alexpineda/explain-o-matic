# Explain-o-matic 🤖🔊

_Voice-guided code change reviews for LLM-generated code_

You know when you're hurting after a 10 hour coding binge and you can't even think about the code your LLM is generating? Maybe this is for you.

![](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![](https://img.shields.io/badge/VSCode-007ACC?logo=visualstudiocode&logoColor=white)

![Demo](https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExb2J0Y3J0d3V0d2V5Y2J4d2N4b2R5d2V6eGJ5b2V5Z2N6dGZ5eGZ5aCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3orieS4jfHJaKwkeli/giphy.gif)

## Features

- 🎙️ **AI-Powered Code Breakdown & Voice Explanations**  
  Automatically splits code changes into logical sections and speaks summaries using your OS's native TTS (no API needed)
- ↔️ **Smart Navigation**  
  Jump between sections with status bar controls and navigator

---

⚠️ **Experimental Warning**

This extension is experimental and not all features are available.

- ✅ Tested on macOS Sequoia
- ⚠️ TTS not tested on Windows/Linux

## Install

```bash
code --install-extension explain-o-matic-0.1.0.vsix
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

- [x] DeepSeek
- [x] OpenAI
- [ ] Google Vertex
- [x] Anthropic
- [x] XAI
- [x] Groq
- [ ] OpenAI Compatible

Feel free to add more providers. We're just wrapping the Vercel AI SDK.

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
> `"explainomatic.fileSizeWarning": 500`

**Other Options**

- `explainomatic.useReasoner` to enable/disable the reasoner
- `explainomatic.showStatusBarButtons` to show/hide the status bar buttons

---

## Future plans

- [ ] Add more LLM providers
- [ ] Support for local LLMs
- [ ] Support for Github Copilot API
- [ ] GUI for configuration

## Maybe?

- [ ] Support for additional context from imported files

📜 **License**  
MIT © 2025
