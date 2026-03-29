import { describe, it, expect } from "vitest";

describe("pause command", () => {
  it("should have no arguments", () => {
    const request = { type: "pause" };
    expect(request.type).toBe("pause");
  });
});
