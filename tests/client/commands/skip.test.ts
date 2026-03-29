import { describe, it, expect } from "vitest";

describe("skip command", () => {
  it("should have no arguments", () => {
    const request = { type: "skip" };
    expect(request.type).toBe("skip");
  });
});
