import { useRef, useState } from "react";
import type { PublicRoom, RoomIntent } from "@friends/types";
import { t } from "./i18n";
import { lobbyWaitingForDiscordJoin } from "./lobbyHints";
import { playersWaitingOnIntent, awaitingLobbyStart } from "./roomOptimistic";
import { colors } from "./theme";

export function LobbyPanel(props: {
  room: PublicRoom;
  currentUserId: string;
  /** Discord Activity instance participants — may exceed Squimbo room until they finish auth. */
  discordParticipantCount?: number | null;
  onIntent: (intent: RoomIntent) => Promise<void>;
  onInvite: () => Promise<void>;
}) {
  const me = props.room.players.find((p) => p.userId === props.currentUserId);
  const continueCount = props.room.players.filter((p) => p.intent === "continue").length;
  const total = props.room.players.length;
  const waitingOnIntent = playersWaitingOnIntent(props.room);
  const starting = awaitingLobbyStart(props.room);
  const waitingDiscord = lobbyWaitingForDiscordJoin(
    total,
    props.discordParticipantCount ?? null,
  );
  const iAmContinue = me?.intent === "continue";
  const intentInFlight = useRef(false);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteHint, setInviteHint] = useState<string | null>(null);

  return (
    <section className="friends-card">
      <p className="kicker">{t("lobby.players")}</p>
      <ul className="player-list">
        {props.room.players.map((p) => (
          <li key={p.userId} className="player-row">
            <span className="player-row-main">
              {p.avatarUrl ? (
                <img className="player-avatar" src={p.avatarUrl} alt="" width={28} height={28} />
              ) : (
                <span className="player-avatar player-avatar-fallback" aria-hidden />
              )}
              <span className="player-name">
                {p.displayName}
                {p.userId === props.currentUserId ? ` · ${t("lobby.you")}` : ""}
              </span>
            </span>
            <span
              className="player-badge"
              style={{
                color: p.intent === "continue" ? colors.accent2 : colors.muted,
              }}
            >
              {p.intent === "continue" ? t("lobby.readyBadge") : t("lobby.waitingBadge")}
            </span>
          </li>
        ))}
      </ul>

      <p className="hint">{t("lobby.sweetSpot")}</p>
      <p className="hint">
        {t("lobby.readyCount", { ready: String(continueCount), total: String(total) })}
      </p>
      {waitingDiscord && <p className="hint">{t("lobby.waitingDiscordJoin")}</p>}
      {!waitingDiscord && total < 2 && <p className="hint">{t("lobby.needPlayers")}</p>}
      {iAmContinue && waitingOnIntent > 0 && (
        <p className="hint">{t("lobby.waitingOnOthers", { count: String(waitingOnIntent) })}</p>
      )}
      {starting && <p className="hint">{t("lobby.starting")}</p>}

      <div className="actions">
        <button
          type="button"
          className={iAmContinue ? "btn btn-ghost is-selected" : "btn btn-primary"}
          disabled={total < 2}
          onClick={() => {
            if (intentInFlight.current || total < 2) return;
            intentInFlight.current = true;
            void props.onIntent(iAmContinue ? "none" : "continue").finally(() => {
              intentInFlight.current = false;
            });
          }}
        >
          {iAmContinue ? t("lobby.notReady") : t("lobby.ready")}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={inviteBusy}
          onClick={() => {
            setInviteBusy(true);
            setInviteHint(null);
            void props
              .onInvite()
              .catch(() => setInviteHint(t("lobby.invitePreview")))
              .finally(() => setInviteBusy(false));
          }}
        >
          {t("lobby.invite")}
        </button>
      </div>
      {inviteHint && <p className="hint">{inviteHint}</p>}
    </section>
  );
}
