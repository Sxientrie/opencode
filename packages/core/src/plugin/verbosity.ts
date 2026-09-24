export * as VerbosityPlugin from "./verbosity.js"

import { define } from "@opencode/plugin/effect/plugin"
import type { SessionRequest } from "@opencode/plugin/effect/session"
import { Effect } from "effect"
import { Model } from "../model.js"
import { Provider } from "../provider.js"
import type { PluginInternal } from "./internal.js"

// Only known OpenAI GPT models get a style default. A new model starts with
// the provider's default until its verbosity support is confirmed.
const supported = new Set([
  "gpt-5",
  "gpt-5-mini",
  "gpt-5-nano",
  "gpt-5.1",
  "gpt-5.2",
  "gpt-5.3-codex",
  "gpt-5.4",
  "gpt-5.4-mini",
  "gpt-5.4-nano",
  "gpt-5.5",
  "gpt-5.6",
  "gpt-5.6-sol",
  "gpt-5.6-terra",
  "gpt-5.6-luna",
  "gpt-6-astra",
  "gpt-6-sol",
  "gpt-6-luna",
])
const direct = new Set([
  "@opencode/ai/providers/openai",
  "@opencode/ai/providers/openai/responses",
  "@opencode/ai/providers/azure",
  "@opencode/ai/providers/azure/responses",
])
const gateways = new Set(["@opencode/ai/providers/cloudflare-ai-gateway", Provider.aisdk("@ai-sdk/gateway")])

export const Plugin = define({
  id: "opencode.prompt.verbosity",
  effect: Effect.fn("VerbosityPlugin")(function* (ctx) {
    const models = yield* Model.Service
    const hook = (event: SessionRequest) =>
      Effect.gen(function* () {
        if (event.options.textVerbosity !== undefined) return
        const model = yield* models.get(event.model.providerID, event.model.id)
        if (!model) return
        const id = openAIModelID(model)
        if (!id || !supported.has(id)) return
        if (model.settings?.textVerbosity !== undefined) return
        const variant = model.variants.find((item) => item.id === event.model.variant)
        if (variant?.settings?.textVerbosity !== undefined) return
        event.options.textVerbosity = "low"
      })
    yield* ctx.session.hook("context", hook)
    yield* ctx.session.hook("compaction", hook)
    yield* ctx.session.hook("generate", hook)
    yield* ctx.session.hook("title", hook)
  }),
} satisfies PluginInternal.InternalPlugin)

function openAIModelID(model: Model.Info) {
  const id = model.modelID.toLowerCase()
  if (direct.has(model.package ?? "")) return id
  if (model.package === "@opencode/ai/providers/amazon-bedrock/mantle/responses" && id.startsWith("openai."))
    return id.slice("openai.".length)
  if (gateways.has(model.package ?? "") && id.startsWith("openai/")) return id.slice("openai/".length)
}
