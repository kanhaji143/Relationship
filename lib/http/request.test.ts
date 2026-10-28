import { describe, expect, it } from "vitest";

import { bearerToken, clientIp, requestOrigin } from "./request";

describe("clientIp", () => {
  it("uses the first forwarded address", () => {
    const request = new Request("http://localhost/", {
      headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" },
    });
    expect(clientIp(request)).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip and then unknown", () => {
    expect(
      clientIp(new Request("http://localhost/", { headers: { "x-real-ip": "198.51.100.4" } })),
    ).toBe("198.51.100.4");
    expect(clientIp(new Request("http://localhost/"))).toBe("unknown");
  });
});

describe("requestOrigin", () => {
  it("derives the origin from the Host header", () => {
    const request = new Request("http://localhost:3210/api", {
      headers: { host: "127.0.0.1:3210" },
    });
    expect(requestOrigin(request)).toBe("http://127.0.0.1:3210");
  });

  it("honours an https forwarded proto", () => {
    const request = new Request("http://localhost/api", {
      headers: { host: "app.example.com", "x-forwarded-proto": "https" },
    });
    expect(requestOrigin(request)).toBe("https://app.example.com");
  });
});

describe("bearerToken", () => {
  it("extracts a bearer token", () => {
    const request = new Request("http://localhost/", {
      headers: { authorization: "Bearer abc.def.ghi" },
    });
    expect(bearerToken(request)).toBe("abc.def.ghi");
  });

  it("rejects missing, empty and oversized tokens", () => {
    expect(bearerToken(new Request("http://localhost/"))).toBeNull();
    expect(
      bearerToken(new Request("http://localhost/", { headers: { authorization: "Bearer   " } })),
    ).toBeNull();
    expect(
      bearerToken(
        new Request("http://localhost/", {
          headers: { authorization: `Bearer ${"x".repeat(9000)}` },
        }),
      ),
    ).toBeNull();
  });
});
