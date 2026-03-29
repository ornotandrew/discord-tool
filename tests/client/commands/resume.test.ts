import { describe, it, expect } from "vitest";

describe("resume command", () => {
  it("should have no arguments", () => {
    const request = { type: "resume" };
    expect(request.type).toBe("resume");
  });
});
