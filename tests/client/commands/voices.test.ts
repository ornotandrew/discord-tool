import { describe, it, expect } from "vitest";

describe("voices command", () => {
  it("should have no arguments", () => {
    const request = { type: "voices" };
    expect(request.type).toBe("voices");
  });
});
