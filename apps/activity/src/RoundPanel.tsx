import { useEffect, useState } from "react";
import type { PublicRoom, RoomIntent } from "@friends/types";
import { t } from "./i18n";
import { isRevealTie, leadersFromTallies } from "./roundReveal";
import { colors } from "./theme";

/** Soft-nudge “wrap up?” from the 8th revealed round onward. */
const SOFT_WRAP_FROM_SESSION_ROUND = 8;

function intentBadge(intent: RoomIntent): { label: string; color: string } {
  if (intent === "continue") return { label: t("round.continueBadge"), color: colors.accent2 };
  if (intent === "wrap_up") return { label: t("round.wrapBadge"), color: colors.accent };
  if (intent === "revote") return { label: t("round.revoteBadge"), color: colors.accent };
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
  useEffect(() => {
    setPicked(null);
  }, [round?.id]);
  if (!round) return null;

  const revealed = round.status !== "voting";
  const playerCount = props.room.players.length;
  const continueCount = props.room.players.filter((p) => p.intent === "continue").length;
  const wrapCount = props.room.players.filter((p) => p.intent === "wrap_up").length;
  const revoteCount = props.room.players.filter((p) => p.intent === "revote").length;
  const softWrap = props.room.sessionRoundCount >= SOFT_WRAP_FROM_SESSION_ROUND;
  const tallies = round.results?.tallies;
  const leaders = tallies ? leadersFromTallies(tallies) : { userIds: [] as string[], votes: 0 };
  const tied = isRevealTie(tallies);
  const leaderPlayers = props.room.players.filter((p) => leaders.userIds.includes(p.userId));
  const leaderNames = leaderPlayers.map((p) => p.displayName).join(", ");

  return (
    <section className="friends-card">
      <p className="kicker">{t("round.kinds.most_likely")}</p>
      <h2 className="friends-title friends-prompt">{round.prompt.body}</h2>

      {!revealed && (
        <div className="choice-stack">
          <p className="hint hint-tight">{t("round.pickPlayer")}</p>
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
                  <span className="player-name">{p.displayName}</span>
                </span>
                <span className="btn-choice-cta">{t("round.vote")}</span>
              </button>
            ))}

          <ul className="player-list" style={{ marginTop: "0.75rem" }}>
            {props.room.players.map((p) => (
              <li key={p.userId} className="player-row">
                <span className="player-row-main">
                  <span className="player-name">{p.displayName}</span>
                </span>
                <span
                  className="player-badge"
                  style={{ color: p.hasVoted ? colors.accent2 : colors.muted }}
                >
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
          {leaderPlayers.length > 0 ? (
            <>
              <p className="reveal-winner">
                {tied
                  ? t("round.revealTie", { names: leaderNames })
                  : t("round.revealWinner", { name: leaderNames })}
              </p>
              <p className="reveal-context">
                {t("round.revealVotes", {
                  votes: String(leaders.votes),
                  total: String(round.voteCount),
                })}
              </p>
              <ul className="player-list reveal-tallies">
                {[...props.room.players]
                  .sort((a, b) => (tallies?.[b.userId] ?? 0) - (tallies?.[a.userId] ?? 0))
                  .map((p) => {
                    const count = tallies?.[p.userId] ?? 0;
                    const isLeader = leaders.userIds.includes(p.userId);
                    return (
                      <li key={p.userId} className={isLeader ? "player-row is-winner" : "player-row"}>
                        <span className="player-row-main">
                          {p.avatarUrl ? (
                            <img className="player-avatar" src={p.avatarUrl} alt="" width={28} height={28} />
                          ) : (
                            <span className="player-avatar player-avatar-fallback" aria-hidden />
                          )}
                          <span className="player-name">{p.displayName}</span>
                        </span>
                        <span className="tally-count">{count}</span>
                      </li>
                    );
                  })}
              </ul>
            </>
          ) : (
            <p className="reveal-line">{t("round.votesLocked")}</p>
          )}

          {tied && <p className="hint">{t("round.tieHint")}</p>}
          {!tied && <p className="hint">{t("round.scoresAtEnd")}</p>}
          {softWrap && !tied && <p className="hint">{t("round.softWrapHint")}</p>}

          <ul className="player-list" style={{ marginTop: "0.85rem" }}>
            {props.room.players.map((p) => {
              const badge = intentBadge(p.intent);
              return (
                <li key={p.userId} className="player-row">
                  <span className="player-row-main">
                    <span className="player-name">{p.displayName}</span>
                  </span>
                  <span className="player-badge" style={{ color: badge.color }}>
                    {badge.label}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="hint">
            {tied
              ? t("round.tieIntentCount", {
                  continue: String(continueCount),
                  revote: String(revoteCount),
                  total: String(playerCount),
                })
              : t("round.intentCount", {
                  continue: String(continueCount),
                  wrap: String(wrapCount),
                  total: String(playerCount),
                })}
          </p>
        </div>
      )}

      {revealed && tied && (
        <div className="actions">
          <button
            type="button"
            className={me?.intent === "revote" ? "btn btn-primary is-selected" : "btn btn-primary"}
            disabled={busy}
            onClick={() => {
              setBusy(true);
              void props
                .onIntent(me?.intent === "revote" ? "none" : "revote")
                .finally(() => setBusy(false));
            }}
          >
            {t("round.revote")}
          </button>
          <button
            type="button"
            className={me?.intent === "continue" ? "btn btn-ghost is-selected" : "btn btn-ghost"}
            disabled={busy}
            onClick={() => {
              setBusy(true);
              void props
                .onIntent(me?.intent === "continue" ? "none" : "continue")
                .finally(() => setBusy(false));
            }}
          >
            {t("round.continueTied")}
          </button>
        </div>
      )}

      {revealed && !tied && (
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
