import { RichText } from "@/components/RichText";

type LegalSection = {
  title: string;
  paragraphs: readonly string[];
  bullets?: readonly string[];
  paragraphsAfterBullets?: readonly string[];
};

type Props = {
  locale: string;
  title: string;
  updated: string;
  sections: readonly LegalSection[];
  email?: string;
  /** Used when a section contains {email} but no support email is configured. */
  contactFallback?: string;
};

/** Renders Privacy / Terms sections from the i18n catalog. */
export function LegalDocument({
  locale,
  title,
  updated,
  sections,
  email,
  contactFallback,
}: Props) {
  return (
    <article className="prose-page">
      <h1>{title}</h1>
      <p className="updated">{updated}</p>

      {sections.map((section) => {
        const usesEmail = section.paragraphs.some((p) => p.includes("{email}"));
        const showFallback = usesEmail && !email && contactFallback;
        const sectionId = section.title.toLowerCase().includes("cookies")
          ? "cookies"
          : undefined;

        return (
          <section key={section.title} id={sectionId}>
            <h2>{section.title}</h2>
            {showFallback && contactFallback ? (
              <p>
                <RichText text={contactFallback} locale={locale} />
              </p>
            ) : (
              section.paragraphs.map((paragraph) => (
                <p key={paragraph}>
                  <RichText text={paragraph} locale={locale} email={email} />
                </p>
              ))
            )}
            {section.bullets && section.bullets.length > 0 ? (
              <ul>
                {section.bullets.map((item) => (
                  <li key={item}>
                    <RichText text={item} locale={locale} email={email} />
                  </li>
                ))}
              </ul>
            ) : null}
            {section.paragraphsAfterBullets?.map((paragraph) => (
              <p key={paragraph}>
                <RichText text={paragraph} locale={locale} email={email} />
              </p>
            ))}
          </section>
        );
      })}
    </article>
  );
}
