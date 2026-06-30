import assert from "node:assert/strict";
import test from "node:test";
import jitiFactory from "jiti";

const jiti = jitiFactory(import.meta.url);
const {
  CLEAN_GENERATION_FAILURE_MESSAGE,
  assertUserDisplayableGenerationResponse,
  isFallbackGenerationResponse
} = await jiti.import("./generation-display-policy.ts", { default: false });
const { createSavedStory } = await jiti.import("./project-persistence.ts", { default: false });
const { getOpenAIDiagnostics } = await jiti.import("./openai-generator.ts", { default: false });

function response(source) {
  return {
    story: "Mara found the first impossible footprint beside the closed diner.",
    metadata: {
      wordCount: 9,
      charactersUsed: ["Mara"],
      rulesReferenced: [],
      source,
      diagnostics: {
        genrePreset: "Speculative Mystery",
        selectedStoryTypeChipLabel: "Small-Town Dread",
        narrativeArchitecture: "Revelation Story",
        characterArc: "Positive Change Arc",
        endingType: "Resolution with Residue",
        lengthTarget: "Compact",
        notice: null,
        underTargetNotice: null
      }
    }
  };
}

test("user display policy rejects fallback generation responses", () => {
  assert.equal(isFallbackGenerationResponse(response("fallback")), true);
  assert.throws(
    () => assertUserDisplayableGenerationResponse(response("fallback")),
    new RegExp(CLEAN_GENERATION_FAILURE_MESSAGE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  );
});

test("user display policy allows model generation responses", () => {
  assert.equal(assertUserDisplayableGenerationResponse(response("openai")).metadata.source, "openai");
});

test("saved-story persistence rejects fallback responses", () => {
  assert.throws(
    () => createSavedStory(response("fallback")),
    new RegExp(CLEAN_GENERATION_FAILURE_MESSAGE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  );
});

test("generation diagnostics expose request, model, and fallback status", () => {
  const diagnostics = getOpenAIDiagnostics({
    generationRequestStarted: true,
    generationRequestStatus: "failed",
    generationEndpointStatusCode: 502,
    requestPayloadValid: true,
    modelGenerationAttempted: false,
    modelGenerationSucceeded: false,
    modelGenerationErrorType: "missing_env",
    fallbackReached: true,
    fallbackUserDisplayBlocked: true
  });

  assert.equal(diagnostics.generationRequestStarted, true);
  assert.equal(diagnostics.generationRequestStatus, "failed");
  assert.equal(diagnostics.generationEndpointStatusCode, 502);
  assert.equal(diagnostics.modelGenerationErrorType, "missing_env");
  assert.equal(diagnostics.fallbackReached, true);
  assert.equal(diagnostics.fallbackUserDisplayBlocked, true);
});
