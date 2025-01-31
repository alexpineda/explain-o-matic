import { createDeepSeek } from "@ai-sdk/deepseek";
import { createOpenAI } from "@ai-sdk/openai";
import { createVertex } from "@ai-sdk/google-vertex";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createXai } from "@ai-sdk/xai";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { reasonerConfig, sectionerConfig, useEnvKeys } from "../config";
import { outputChannel } from "../elements/output-channel";

export const providers = {
  deepseek: createDeepSeek,
  openai: createOpenAI,
  vertex: createVertex,
  anthropic: createAnthropic,
  xai: createXai,
  groq: createGroq,
  openaiCompatible: createOpenAICompatible,
};

export type Provider = keyof typeof providers;

export const providerKeys = Object.keys(providers) as Provider[];

export const createModel = (provider: Provider, apiKey: string) => {
  if (provider === "vertex") {
    throw new Error("Vertex is not supported yet");
    // return createVertex({
    //   apiKey,
    // });
  } else if (provider === "openaiCompatible") {
    throw new Error("OpenAI Compatible is not supported yet");
    // return createOpenAICompatible({
    //   apiKey,
    // });
  }
  return providers[provider]({
    apiKey,
  });
};

export const createReasonerModel = () => {
  outputChannel.appendLine(
    `Creating reasoner model with provider ${reasonerConfig.provider} and api key ${reasonerConfig.apiKey}`
  );
  return createModel(
    reasonerConfig.provider as Provider,
    getApiKey(reasonerConfig.apiKey, reasonerConfig.provider as EnvKeyProvider)
  )(reasonerConfig.model);
};

export const createSectionerModel = () => {
  outputChannel.appendLine(
    `Creating sectioner model with provider ${sectionerConfig.provider} and api key ${sectionerConfig.apiKey}`
  );
  return createModel(
    sectionerConfig.provider as Provider,
    getApiKey(
      sectionerConfig.apiKey,
      sectionerConfig.provider as EnvKeyProvider
    )
  )(sectionerConfig.model);
};

type EnvKeyProvider = Exclude<Provider, "vertex" | "openaiCompatible">;

const envKeys: Record<EnvKeyProvider, string> = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  deepseek: "DEEPSEEK_API_KEY",
  xai: "XAI_API_KEY",
  groq: "GROQ_API_KEY",
};

const envKeyProviders = Object.keys(envKeys) as EnvKeyProvider[];

export const getApiKey = (configKey: string, provider: EnvKeyProvider) => {
  let envKey = "";

  if (useEnvKeys) {
    if (envKeyProviders.includes(provider)) {
      envKey = process.env[envKeys[provider]] ?? "";
    }
  }
  const key = configKey || envKey;
  outputChannel.appendLine(`Using key: ${key}`);
  return key;
};
