import { describe, it, expect } from "vitest";

describe("queue command", () => {
  it("should have no arguments", () => {
    const request = { type: "queue" };
    expect(request.type).toBe("queue");
  });

  it("should format queue response", () => {
    const queueResponse = {
      queue: [
        { id: "1", type: "file", path: "/audio1.mp3" },
        { id: "2", type: "tts", text: "Hello" },
      ],
    };
    expect(queueResponse.queue).toHaveLength(2);
  });
});
