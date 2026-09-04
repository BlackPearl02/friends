import { useState } from "react";
import type { PublicRoom } from "@friends/types";
import { t } from "./i18n";
import { cardStyle, colors } from "./theme";

export function FinishedPanel(props: {
  room: PublicRoom;
  currentUserId: string;
  onReplay: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const ranked = [...props.room.players].sort((a, b) => b.score - a.score);
  const champion = ranked[0];
  const tied =
    champion &&
    champion.score > 0 &&
    ranked.filter((p) => p.score === champion.score).length > 1;

  return (
    <section style={cardStyle}>
      <p className="kicker">{t("finished.title")}</p>
      {champion && champion.score > 0 && (
        <p className="reveal-winner" style={{ marginTop: "0.35rem" }}>
          {tied
            ? t("finished.tie", {
                names: ranked
                  .filter((p) => p.score === champion.score)
                  .map((p) => p.displayName)
                  .join(", "),
              })
            : t("finished.champion", { name: champion.displayName })}
        </p>
      )}
      <h2 className="friends-title" style={{ margin: "0.45rem 0 0.85rem", fontSize: "1.2rem" }}>
        {t("finished.scoreboard")}
      </h2>
      <ul className="player-list">
        {ranked.map((p, i) => (
          <li key={p.userId} className={i === 0 && p.score > 0 ? "player-row is-winner" : "player-row"}>
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
            <span style={{ color: colors.accent2, fontWeight: 800 }}>{p.score}</span>
          </li>
        ))}
      </ul>

      <div className="actions">
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            void props.onReplay().finally(() => setBusy(false));
          }}
        >
          {t("finished.playAgain")}
        </button>
      </div>
    </section>
  );
}
