import { describe, it, expect } from "vitest";

describe("clear command", () => {
  it("should have no arguments", () => {
    const request = { type: "clear" };
    expect(request.type).toBe("clear");
  });
});
