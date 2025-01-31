# Explain-o-matic 🤖🔊

_Voice-guided code change reviews for LLM-generated code_

![](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![](https://img.shields.io/badge/VSCode-007ACC?logo=visualstudiocode&logoColor=white)

![Demo](https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExb2J0Y3J0d3V0d2V5Y2J4d2N4b2R5d2V6eGJ5b2V5Z2N6dGZ5eGZ5aCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3orieS4jfHJaKwkeli/giphy.gif)

## Features

- 🎙️ **AI-Powered Code Breakdown**  
  Automatically splits code changes into logical sections
- 📢 **Voice Explanations**  
  Speaks summaries using your OS's native TTS (no API needed)
- 🖍️ **Visual Highlights**  
  Color-coded code section decorations
- ↔️ **Smart Navigation**  
  Jump between sections with status bar controls
- 📝 **Text Summaries**  
  Side panel shows section descriptions

---

⚠️ **Experimental Warning**

This extension is currently in beta testing phase:

- ✅ Tested on macOS Sequoia
- ⚠️ TTS not tested on Windows/Linux

## Install

```bash
code --install-extension explain-o-matic-0.1.0.vsix
```

## Usage

1. Run `Explain-o-matic: Start Review` from command palette
2. Use these controls:
   - `Next Section` → Status bar →
   - `Stop Review` → Status bar ⬛
3. Click sections in side panel to jump

## Config

Add to settings.json:

```json
"explainomatic.useReasoner": true,
"explainomatic.useEnvKeys": false,
"explainomatic.llm": {
    "reasoner": {
        "provider": "deepseek",
        "model": "deepseek-reasoning",
        "apiKey": "sk-your-key-here",
    },
    "sectioner": {
        "provider": "anthropic",
        "model": "claude-3-5-sonnet-20240620",
        "apiKey": "sk-your-key-here",
        "temperature": 0.1
    }
}
```

If reasoner is enabled, it will be used to analyze the code and pass on it's output to the codeReviewer. Meant for models that expose their reasoning process only.

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

## Troubleshooting

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

---

## Future plans

- [ ] Add more LLM providers
- [ ] Support for local LLMs
- [ ] Breakdown of sections into smaller sections
- [ ] More options like disabling the status bar controls
- [ ] GUI for configuration

## Maybe?

- [ ] Support for additional context from imported files

📜 **License**  
MIT © 2025
