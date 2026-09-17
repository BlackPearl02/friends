import { describe, expect, it } from "vitest";
import { isShellLoading, shellBannerKind } from "./shellStatus";

describe("isShellLoading", () => {
  it("is true only for boot and authorizing", () => {
    expect(isShellLoading("boot")).toBe(true);
    expect(isShellLoading("authorizing")).toBe(true);
    expect(isShellLoading("waiting-in-progress")).toBe(false);
    expect(isShellLoading("ready")).toBe(false);
    expect(isShellLoading("error")).toBe(false);
    expect(isShellLoading("missing-client-id")).toBe(false);
  });
});

describe("shellBannerKind", () => {
  it("maps missing client id", () => {
    expect(shellBannerKind("missing-client-id", null)).toBe("notConfigured");
  });

  it("maps loading phases before treating as error", () => {
    expect(shellBannerKind("boot", null)).toBe("loading");
    expect(shellBannerKind("authorizing", null)).toBe("loading");
  });

  it("maps mid-session wait separately from errors", () => {
    expect(shellBannerKind("waiting-in-progress", null)).toBe("waitingInProgress");
  });

  it("does not treat ready as an error banner", () => {
    expect(shellBannerKind("ready", null)).toBe("genericError");
  });

  it("classifies sign-in style failures from the message", () => {
    expect(shellBannerKind("error", "HTTP 401")).toBe("signInFailed");
    expect(shellBannerKind("error", "Sign-in failed")).toBe("signInFailed");
    expect(shellBannerKind("error", "Discord authorize timed out after 12000ms")).toBe(
      "signInFailed",
    );
    expect(shellBannerKind("error", "Activity code exchange timed out after 15000ms")).toBe(
      "signInFailed",
    );
  });

  it("falls back to generic for other errors", () => {
    expect(shellBannerKind("error", "no sdk")).toBe("genericError");
    expect(shellBannerKind("error", null)).toBe("genericError");
  });
});
