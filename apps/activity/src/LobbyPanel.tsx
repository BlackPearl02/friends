import { useState } from "react";
import type { PublicRoom, RoomIntent } from "@friends/types";
import { t } from "./i18n";
import { cardStyle, colors } from "./theme";

export function LobbyPanel(props: {
  room: PublicRoom;
  currentUserId: string;
  onIntent: (intent: RoomIntent) => Promise<void>;
  onInvite: () => Promise<void>;
}) {
  const me = props.room.players.find((p) => p.userId === props.currentUserId);
  const continueCount = props.room.players.filter((p) => p.intent === "continue").length;
  const total = props.room.players.length;
  const iAmContinue = me?.intent === "continue";
  const [busy, setBusy] = useState(false);
  const [inviteHint, setInviteHint] = useState<string | null>(null);

  return (
    <section style={cardStyle}>
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
              <span>
                {p.displayName}
                {p.userId === props.currentUserId ? ` · ${t("lobby.you")}` : ""}
              </span>
            </span>
            <span
              style={{
                color: p.intent === "continue" ? colors.accent2 : colors.muted,
                fontWeight: 800,
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
      {total < 2 && <p className="hint">{t("lobby.needPlayers")}</p>}

      <div className="actions">
        <button
          type="button"
          className={iAmContinue ? "btn btn-ghost is-selected" : "btn btn-primary"}
          disabled={busy || total < 2}
          onClick={() => {
            setBusy(true);
            void props.onIntent(iAmContinue ? "none" : "continue").finally(() => setBusy(false));
          }}
        >
          {iAmContinue ? t("lobby.notReady") : t("lobby.ready")}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            setInviteHint(null);
            void props
              .onInvite()
              .catch(() => setInviteHint(t("lobby.invitePreview")))
              .finally(() => setBusy(false));
          }}
        >
          {t("lobby.invite")}
        </button>
      </div>
      {inviteHint && <p className="hint">{inviteHint}</p>}
    </section>
  );
}
