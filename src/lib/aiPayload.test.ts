import { describe, expect, it } from "vitest";
import { withoutUndefined } from "./aiPayload";

describe("withoutUndefined", () => {
  it("drops undefined keys at every depth so they never reach the server as null", () => {
    const payload = {
      mode: "tutor",
      input: { messages: [{ role: "user", content: "Hi" }], socratic: false, context: undefined },
      learner: { targetRole: undefined, level: 4 },
    };
    const out = withoutUndefined(payload);
    expect(out).toEqual({ mode: "tutor", input: { messages: [{ role: "user", content: "Hi" }], socratic: false }, learner: { level: 4 } });
    expect("context" in out.input).toBe(false);
    expect("targetRole" in out.learner).toBe(false);
  });

  it("keeps falsy values that are real data", () => {
    expect(withoutUndefined({ a: 0, b: "", c: false, d: null, e: [1, undefined, 2] })).toEqual({ a: 0, b: "", c: false, d: null, e: [1, 2] });
  });
});
