import { env, SELF } from "cloudflare:test";
import { describe, it, expect } from "vitest";

describe("l1nk API", () => {
  it('should return "l1nk API" on GET /', async () => {
    const response = await SELF.fetch("http://example.com/");
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("l1nk API");
  });

  it('should return "Google Login Not Implemented Yet" on GET /auth/login/google', async () => {
    const response = await SELF.fetch("http://example.com/auth/login/google");
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("Google Login Not Implemented Yet");
  });
});
