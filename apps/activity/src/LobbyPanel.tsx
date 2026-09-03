import { useMemo, useState } from "react";
import type { PromptCategory, PublicRoom } from "@friends/types";
import { t } from "./i18n";
import { btnGhostStyle, btnPrimaryStyle, cardStyle, colors } from "./theme";

const PACKS: PromptCategory[] = ["party", "family", "colleagues", "spicy"];

export function LobbyPanel(props: {
  room: PublicRoom;
  currentUserId: string;
  onStart: (category: PromptCategory) => Promise<void>;
}) {
  const isHost = props.room.hostUserId === props.currentUserId;
  const [category, setCategory] = useState<PromptCategory>("party");
  const [busy, setBusy] = useState(false);
  const packLabel = useMemo(
    () => ({
      party: t("lobby.party"),
      family: t("lobby.family"),
      colleagues: t("lobby.colleagues"),
      spicy: t("lobby.spicy"),
    }),
    [],
  );

  return (
    <section style={cardStyle}>
      <p style={{ margin: 0, fontSize: "0.75rem", color: colors.muted, letterSpacing: "0.06em" }}>
        {t("lobby.players").toUpperCase()}
      </p>
      <ul style={{ listStyle: "none", padding: 0, margin: "0.65rem 0 0" }}>
        {props.room.players.map((p) => (
          <li
            key={p.userId}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "0.5rem",
              padding: "0.35rem 0",
              borderBottom: `1px solid ${colors.border}`,
            }}
          >
            <span>
              {p.displayName}
              {p.userId === props.currentUserId ? ` · ${t("lobby.you")}` : ""}
              {p.isHost ? ` · ${t("lobby.host")}` : ""}
            </span>
            <span style={{ color: colors.accent2 }}>{p.score}</span>
          </li>
        ))}
      </ul>

      {isHost ? (
        <>
          <p style={{ margin: "1rem 0 0.5rem", fontSize: "0.85rem", color: colors.muted }}>
            {t("lobby.pickPack")}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {PACKS.map((pack) => (
              <button
                key={pack}
                type="button"
                style={{
                  ...btnGhostStyle,
                  background: category === pack ? colors.surface2 : "transparent",
                  borderColor: category === pack ? colors.accent : colors.border,
                }}
                onClick={() => setCategory(pack)}
              >
                {packLabel[pack]}
              </button>
            ))}
          </div>
          <div style={{ marginTop: "0.9rem" }}>
            <button
              type="button"
              style={btnPrimaryStyle}
              disabled={busy}
              onClick={() => {
                setBusy(true);
                void props.onStart(category).finally(() => setBusy(false));
              }}
            >
              {t("lobby.start")}
            </button>
          </div>
        </>
      ) : (
        <p style={{ margin: "1rem 0 0", color: colors.muted }}>{t("lobby.waitingHost")}</p>
      )}
    </section>
  );
}
