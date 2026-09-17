import { t } from "./i18n";

export type PromptDealVariant = "start" | "next";

/** Skeleton prompt card while Nest draws the next question (Ready / Continue wait). */
export function PromptDealBox(props: { variant: PromptDealVariant }) {
  const title =
    props.variant === "start" ? t("lobby.dealTitle") : t("round.dealTitle");
  const subtitle =
    props.variant === "start" ? t("lobby.dealSubtitle") : t("round.dealSubtitle");

  return (
    <div className="prompt-deal" aria-live="polite" aria-busy="true" role="status">
      <p className="prompt-deal-title">{title}</p>
      <p className="prompt-deal-subtitle">{subtitle}</p>
      <div className="prompt-deal-card" aria-hidden>
        <span className="prompt-deal-line prompt-deal-line-lg" />
        <span className="prompt-deal-line prompt-deal-line-md" />
        <span className="prompt-deal-line prompt-deal-line-sm" />
      </div>
    </div>
  );
}
