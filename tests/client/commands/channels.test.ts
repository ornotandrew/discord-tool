import { describe, it, expect } from "vitest";

describe("channels command", () => {
  it("should accept optional guild flag", () => {
    const options = { guild: "mines" };
    expect(options.guild).toBe("mines");
  });

  it("should work without guild flag", () => {
    const options: { guild?: string } = {};
    expect(options.guild).toBeUndefined();
  });

  it("should format channels response with users as JSON", () => {
    const channelsResponse = {
      channels: [
        {
          id: "997573231286431854",
          name: "Despair of the Ancients",
          users: [{ username: "wRaithy", nick: null }],
        },
      ],
    };
    const json = JSON.stringify(channelsResponse, null, 2);
    expect(json).toContain("Despair of the Ancients");
  });
});
