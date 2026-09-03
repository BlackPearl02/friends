import { useState } from "react";
import type { PublicRoom } from "@friends/types";
import { t } from "./i18n";
import { btnGhostStyle, btnPrimaryStyle, cardStyle, colors } from "./theme";

export function RoundPanel(props: {
  room: PublicRoom;
  currentUserId: string;
  onVote: (body: { targetUserId?: string; choice?: "a" | "b" | "complete" | "skip"; text?: string }) => Promise<void>;
  onReveal: () => Promise<void>;
  onNext: () => Promise<void>;
}) {
  const round = props.room.round;
  const isHost = props.room.hostUserId === props.currentUserId;
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  if (!round) return null;

  const revealed = round.status !== "voting";

  return (
    <section style={cardStyle}>
      <p style={{ margin: 0, fontSize: "0.75rem", color: colors.accent2 }}>
        {round.prompt.kind.replaceAll("_", " ")} · {round.prompt.category}
      </p>
      <h2 style={{ margin: "0.35rem 0 0.75rem", fontSize: "1.15rem" }}>{round.prompt.body}</h2>

      {!revealed && round.prompt.kind === "most_likely" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {props.room.players
            .filter((p) => p.userId !== props.currentUserId)
            .map((p) => (
              <button
                key={p.userId}
                type="button"
                style={btnGhostStyle}
                disabled={busy}
                onClick={() => {
                  setBusy(true);
                  void props.onVote({ targetUserId: p.userId }).finally(() => setBusy(false));
                }}
              >
                {t("round.vote")}: {p.displayName}
              </button>
            ))}
        </div>
      )}

      {!revealed && round.prompt.kind === "this_or_that" && (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {(["a", "b"] as const).map((choice) => (
            <button
              key={choice}
              type="button"
              style={btnPrimaryStyle}
              disabled={busy}
              onClick={() => {
                setBusy(true);
                void props.onVote({ choice }).finally(() => setBusy(false));
              }}
            >
              {choice === "a" ? round.prompt.optionA : round.prompt.optionB}
            </button>
          ))}
        </div>
      )}

      {!revealed && (round.prompt.kind === "truth" || round.prompt.kind === "challenge") && (
        <div>
          {round.prompt.kind === "truth" && (
            <>
              <label htmlFor="answer" style={{ display: "block", fontSize: "0.8rem", color: colors.muted }}>
                {t("round.yourAnswer")}
              </label>
              <input
                id="answer"
                value={text}
                onChange={(e) => setText(e.target.value)}
                style={{
                  width: "100%",
                  margin: "0.35rem 0 0.7rem",
                  padding: "0.55rem 0.7rem",
                  borderRadius: "0.6rem",
                  border: `1px solid ${colors.border}`,
                  background: colors.surface2,
                  color: colors.text,
                }}
              />
            </>
          )}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              style={btnPrimaryStyle}
              disabled={busy}
              onClick={() => {
                setBusy(true);
                void props
                  .onVote(
                    round.prompt.kind === "truth"
                      ? { text, choice: text.trim() ? "complete" : "skip" }
                      : { choice: "complete" },
                  )
                  .finally(() => setBusy(false));
              }}
            >
              {round.prompt.kind === "challenge" ? t("round.complete") : t("round.vote")}
            </button>
            <button
              type="button"
              style={btnGhostStyle}
              disabled={busy}
              onClick={() => {
                setBusy(true);
                void props.onVote({ choice: "skip" }).finally(() => setBusy(false));
              }}
            >
              {t("round.skip")}
            </button>
          </div>
        </div>
      )}

      {revealed && round.results && (
        <ul style={{ paddingLeft: "1.1rem", margin: "0.4rem 0 0" }}>
          {Object.entries(round.results.tallies).map(([key, n]) => {
            const player = props.room.players.find((p) => p.userId === key);
            return (
              <li key={key}>
                {player?.displayName ?? key}: {n}
              </li>
            );
          })}
        </ul>
      )}

      {!revealed && isHost && (
        <div style={{ marginTop: "1rem" }}>
          <button
            type="button"
            style={btnPrimaryStyle}
            disabled={busy}
            onClick={() => {
              setBusy(true);
              void props.onReveal().finally(() => setBusy(false));
            }}
          >
            {t("round.reveal")}
          </button>
        </div>
      )}
      {!revealed && !isHost && (
        <p style={{ margin: "1rem 0 0", color: colors.muted }}>{t("round.waitingReveal")}</p>
      )}
      {revealed && isHost && (
        <div style={{ marginTop: "1rem" }}>
          <button
            type="button"
            style={btnPrimaryStyle}
            disabled={busy}
            onClick={() => {
              setBusy(true);
              void props.onNext().finally(() => setBusy(false));
            }}
          >
            {t("round.next")}
          </button>
        </div>
      )}
    </section>
  );
}
