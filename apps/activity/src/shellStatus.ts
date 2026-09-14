/** Boot / auth phases for the Activity shell (not Discord error strings). */
export type ShellPhase =
  | "boot"
  | "authorizing"
  | "waiting-in-progress"
  | "ready"
  | "missing-client-id"
  | "error";

export function isShellLoading(phase: ShellPhase): boolean {
  return phase === "boot" || phase === "authorizing";
}

export function shellBannerKind(
  phase: ShellPhase,
  errorMessage: string | null,
): "notConfigured" | "loading" | "waitingInProgress" | "signInFailed" | "genericError" {
  if (phase === "missing-client-id") return "notConfigured";
  if (phase === "waiting-in-progress") return "waitingInProgress";
  if (isShellLoading(phase)) return "loading";
  if (phase !== "error") return "genericError";
  const msg = (errorMessage ?? "").toLowerCase();
  if (msg.includes("http") || msg.includes("sign")) return "signInFailed";
  return "genericError";
}
