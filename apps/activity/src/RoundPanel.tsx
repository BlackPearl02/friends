import { useState } from "react";
import type { PublicRoom, RoomIntent } from "@friends/types";
import { t } from "./i18n";
import { cardStyle, colors } from "./theme";

/** Soft-nudge “wrap up?” from the 8th revealed round onward. */
const SOFT_WRAP_FROM_SESSION_ROUND = 8;

function intentBadge(intent: RoomIntent): { label: string; color: string } {
  if (intent === "continue") return { label: t("round.continueBadge"), color: colors.accent2 };
  if (intent === "wrap_up") return { label: t("round.wrapBadge"), color: colors.accent };
  return { label: t("round.waitingBadge"), color: colors.muted };
}

export function RoundPanel(props: {
  room: PublicRoom;
  currentUserId: string;
  onVote: (body: { targetUserId?: string; choice?: "a" | "b" | "complete" | "skip"; text?: string }) => Promise<void>;
  onIntent: (intent: RoomIntent) => Promise<void>;
}) {
  const round = props.room.round;
  const me = props.room.players.find((p) => p.userId === props.currentUserId);
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  if (!round) return null;

  const revealed = round.status !== "voting";
  const playerCount = props.room.players.length;
  const continueCount = props.room.players.filter((p) => p.intent === "continue").length;
  const wrapCount = props.room.players.filter((p) => p.intent === "wrap_up").length;
  const softWrap = props.room.sessionRoundCount >= SOFT_WRAP_FROM_SESSION_ROUND;

  return (
    <section style={cardStyle}>
      <p className="kicker">{t("round.kinds.most_likely")}</p>
      <h2 className="friends-title" style={{ margin: "0.45rem 0 0.85rem", fontSize: "1.2rem", lineHeight: 1.3 }}>
        {round.prompt.body}
      </h2>

      {!revealed && (
        <div className="choice-stack">
          <p className="hint" style={{ marginTop: 0 }}>
            {t("round.pickPlayer")}
          </p>
          {props.room.players
            .filter((p) => p.userId !== props.currentUserId)
            .map((p) => (
              <button
                key={p.userId}
                type="button"
                className={picked === p.userId ? "btn btn-choice is-selected" : "btn btn-choice"}
                disabled={busy}
                onClick={() => {
                  setPicked(p.userId);
                  setBusy(true);
                  void props.onVote({ targetUserId: p.userId }).finally(() => setBusy(false));
                }}
              >
                <span className="player-row-main">
                  {p.avatarUrl ? (
                    <img className="player-avatar" src={p.avatarUrl} alt="" width={28} height={28} />
                  ) : (
                    <span className="player-avatar player-avatar-fallback" aria-hidden />
                  )}
                  <span>{p.displayName}</span>
                </span>
                <span className="btn-choice-cta">{t("round.vote")}</span>
              </button>
            ))}

          <ul className="player-list" style={{ marginTop: "0.75rem" }}>
            {props.room.players.map((p) => (
              <li key={p.userId} className="player-row">
                <span className="player-row-main">
                  <span>{p.displayName}</span>
                </span>
                <span style={{ color: p.hasVoted ? colors.accent2 : colors.muted, fontWeight: 800 }}>
                  {p.hasVoted ? t("round.votedBadge") : t("round.waitingVoteBadge")}
                </span>
              </li>
            ))}
          </ul>
          <p className="hint">
            {t("round.votesInFlight", {
              voted: String(round.voteCount),
              total: String(playerCount),
            })}
          </p>
          <p className="hint">{t("round.waitingVotes")}</p>
        </div>
      )}

      {revealed && (
        <div className="reveal-block">
          <p className="reveal-line">{t("round.votesLocked")}</p>
          <p className="hint">{t("round.scoresAtEnd")}</p>

          {softWrap && <p className="hint">{t("round.softWrapHint")}</p>}

          <ul className="player-list" style={{ marginTop: "0.85rem" }}>
            {props.room.players.map((p) => {
              const badge = intentBadge(p.intent);
              return (
                <li key={p.userId} className="player-row">
                  <span className="player-row-main">
                    <span>{p.displayName}</span>
                  </span>
                  <span style={{ color: badge.color, fontWeight: 800 }}>{badge.label}</span>
                </li>
              );
            })}
          </ul>
          <p className="hint">
            {t("round.intentCount", {
              continue: String(continueCount),
              wrap: String(wrapCount),
              total: String(playerCount),
            })}
          </p>
        </div>
      )}

      {revealed && (
        <div className="actions">
          <button
            type="button"
            className={me?.intent === "continue" ? "btn btn-primary is-selected" : "btn btn-primary"}
            disabled={busy}
            onClick={() => {
              setBusy(true);
              void props
                .onIntent(me?.intent === "continue" ? "none" : "continue")
                .finally(() => setBusy(false));
            }}
          >
            {t("round.continue")}
          </button>
          <button
            type="button"
            className={
              me?.intent === "wrap_up"
                ? softWrap
                  ? "btn btn-primary is-selected"
                  : "btn btn-ghost is-selected"
                : softWrap
                  ? "btn btn-primary"
                  : "btn btn-ghost"
            }
            disabled={busy}
            onClick={() => {
              setBusy(true);
              void props
                .onIntent(me?.intent === "wrap_up" ? "none" : "wrap_up")
                .finally(() => setBusy(false));
            }}
          >
            {t("round.wrapUp")}
          </button>
        </div>
      )}
    </section>
  );
}
