import { useEffect, useRef, useState } from "react";
import type { PublicRoom, RoomIntent } from "@friends/types";
import { t } from "./i18n";
import { playersWaitingOnIntent } from "./roomOptimistic";
import { isRevealTie, leadersFromTallies, msUntilReveal, shouldShowRevealResults } from "./roundReveal";
import { colors } from "./theme";

/** Soft-nudge “wrap up?” from the 8th revealed round onward. */
const SOFT_WRAP_FROM_SESSION_ROUND = 8;

function intentBadge(intent: RoomIntent): { label: string; color: string } {
  if (intent === "continue") return { label: t("round.continueBadge"), color: colors.accent2 };
  if (intent === "wrap_up") return { label: t("round.wrapBadge"), color: colors.accent };
  if (intent === "revote") return { label: t("round.revoteBadge"), color: colors.accent };
  return { label: t("round.waitingBadge"), color: colors.muted };
}

/** Unanimous continue / wrap / revote — Nest is about to advance the phase. */
export function awaitingRevealAdvance(room: PublicRoom, tied: boolean): boolean {
  if (room.status !== "playing" || room.round?.status !== "reveal") return false;
  if (room.players.length < 2) return false;
  if (tied) {
    return (
      room.players.every((p) => p.intent === "revote") ||
      room.players.every((p) => p.intent === "continue")
    );
  }
  return (
    room.players.every((p) => p.intent === "continue") ||
    room.players.every((p) => p.intent === "wrap_up")
  );
}

export function RoundPanel(props: {
  room: PublicRoom;
  currentUserId: string;
  onVote: (body: {
    targetUserId?: string;
    choice?: "a" | "b" | "complete" | "skip";
    text?: string;
  }) => Promise<void>;
  onIntent: (intent: RoomIntent) => Promise<void>;
}) {
  const round = props.room.round;
  const me = props.room.players.find((p) => p.userId === props.currentUserId);
  const voteInFlight = useRef(false);
  const intentInFlight = useRef(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [revealGate, setRevealGate] = useState(0);
  const [advanceLatched, setAdvanceLatched] = useState(false);

  useEffect(() => {
    setPicked(null);
    voteInFlight.current = false;
    intentInFlight.current = false;
    setAdvanceLatched(false);
  }, [round?.id]);

  useEffect(() => {
    if (!round || round.status === "voting") return;
    const wait = msUntilReveal(round.revealedAt, props.room.serverTime);
    if (wait === 0) return;
    const id = window.setTimeout(() => setRevealGate((n) => n + 1), wait);
    return () => window.clearTimeout(id);
  }, [round?.id, round?.status, round?.revealedAt, props.room.serverTime]);

  const talliesPreview = round?.results?.tallies;
  const tiedPreview = isRevealTie(talliesPreview);
  const advancingNow = round ? awaitingRevealAdvance(props.room, tiedPreview) : false;

  useEffect(() => {
    if (advancingNow) setAdvanceLatched(true);
  }, [advancingNow]);

  if (!round) return null;

  void revealGate;
  // Hold UI until tallies exist — otherwise "Votes are in." flashes before GET.
  const revealed = shouldShowRevealResults(round, props.room.serverTime);
  const holdingReveal = round.status !== "voting" && !revealed;
  const playerCount = props.room.players.length;
  const tallies = round.results?.tallies;
  const leaders = tallies ? leadersFromTallies(tallies) : { userIds: [] as string[], votes: 0 };
  const tied = isRevealTie(tallies);
  const advancing = advanceLatched || advancingNow;

  const continueCount = advancing
    ? playerCount
    : props.room.players.filter((p) => p.intent === "continue").length;
  const wrapCount = props.room.players.filter((p) => p.intent === "wrap_up").length;
  const revoteCount = props.room.players.filter((p) => p.intent === "revote").length;
  const waitingOnIntent = playersWaitingOnIntent(props.room);
  const softWrap = props.room.sessionRoundCount >= SOFT_WRAP_FROM_SESSION_ROUND;
  const leaderPlayers = leaders.userIds
    .map((id) => props.room.players.find((p) => p.userId === id))
    .filter((p): p is NonNullable<typeof p> => p != null);
  const leaderNames = leaderPlayers.map((p) => p.displayName).join(", ");
  const showWaitingOnOthers =
    revealed && !advancing && me != null && me.intent !== "none" && waitingOnIntent > 0;

  const runIntent = (intent: RoomIntent) => {
    if (intentInFlight.current || advancing) return;
    intentInFlight.current = true;
    void props.onIntent(intent).finally(() => {
      intentInFlight.current = false;
    });
  };

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
                disabled={holdingReveal || Boolean(picked) || me?.hasVoted}
                onClick={() => {
                  if (holdingReveal || voteInFlight.current || me?.hasVoted) return;
                  voteInFlight.current = true;
                  setPicked(p.userId);
                  void props.onVote({ targetUserId: p.userId }).finally(() => {
                    voteInFlight.current = false;
                  });
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
            {props.room.players.map((p) => {
              const voted = holdingReveal || p.hasVoted;
              return (
                <li key={p.userId} className="player-row">
                  <span className="player-row-main">
                    <span className="player-name">{p.displayName}</span>
                  </span>
                  <span
                    className="player-badge"
                    style={{ color: voted ? colors.accent2 : colors.muted }}
                  >
                    {voted ? t("round.votedBadge") : t("round.waitingVoteBadge")}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="hint">
            {t("round.votesInFlight", {
              voted: String(holdingReveal ? playerCount : round.voteCount),
              total: String(playerCount),
            })}
          </p>
          <p className="hint">
            {holdingReveal ? t("round.revealHold") : t("round.waitingVotes")}
          </p>
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
                  .sort((a, b) => {
                    const byVotes = (tallies?.[b.userId] ?? 0) - (tallies?.[a.userId] ?? 0);
                    if (byVotes !== 0) return byVotes;
                    return a.userId.localeCompare(b.userId);
                  })
                  .map((p) => {
                    const count = tallies?.[p.userId] ?? 0;
                    const isLeader = leaders.userIds.includes(p.userId);
                    return (
                      <li
                        key={p.userId}
                        className={isLeader ? "player-row is-winner" : "player-row"}
                      >
                        <span className="player-row-main">
                          {p.avatarUrl ? (
                            <img
                              className="player-avatar"
                              src={p.avatarUrl}
                              alt=""
                              width={28}
                              height={28}
                            />
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
              const badge = advancing
                ? { label: t("round.continueBadge"), color: colors.accent2 }
                : intentBadge(p.intent);
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
            {advancing
              ? t("round.advancing")
              : tied
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
          {showWaitingOnOthers && (
            <p className="hint">
              {t("round.waitingOnOthers", { count: String(waitingOnIntent) })}
            </p>
          )}
        </div>
      )}

      {revealed && tied && !advancing && (
        <div className="actions">
          <button
            type="button"
            className={me?.intent === "revote" ? "btn btn-primary is-selected" : "btn btn-primary"}
            onClick={() => runIntent(me?.intent === "revote" ? "none" : "revote")}
          >
            {t("round.revote")}
          </button>
          <button
            type="button"
            className={me?.intent === "continue" ? "btn btn-ghost is-selected" : "btn btn-ghost"}
            onClick={() => runIntent(me?.intent === "continue" ? "none" : "continue")}
          >
            {t("round.continueTied")}
          </button>
        </div>
      )}

      {revealed && !tied && !advancing && (
        <div className="actions">
          <button
            type="button"
            className={me?.intent === "continue" ? "btn btn-primary is-selected" : "btn btn-primary"}
            onClick={() => runIntent(me?.intent === "continue" ? "none" : "continue")}
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
            onClick={() => runIntent(me?.intent === "wrap_up" ? "none" : "wrap_up")}
          >
            {t("round.wrapUp")}
          </button>
        </div>
      )}
    </section>
  );
}
