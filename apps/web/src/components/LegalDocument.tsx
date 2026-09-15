type LegalSection = {
  title: string;
  paragraphs: readonly string[];
  bullets?: readonly string[];
  paragraphsAfterBullets?: readonly string[];
};

type Props = {
  title: string;
  updated: string;
  sections: readonly LegalSection[];
  email?: string;
  /** Used when a section contains {email} but no support email is configured. */
  contactFallback?: string;
};

function withEmail(text: string, email: string | undefined) {
  if (!email || !text.includes("{email}")) return text;
  return text.replace(/\{email\}/g, email);
}

/** Renders Privacy / Terms sections from the i18n catalog. */
export function LegalDocument({
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

        return (
          <section key={section.title}>
            <h2>{section.title}</h2>
            {showFallback ? (
              <p>{contactFallback}</p>
            ) : (
              section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{withEmail(paragraph, email)}</p>
              ))
            )}
            {section.bullets && section.bullets.length > 0 ? (
              <ul>
                {section.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
            {section.paragraphsAfterBullets?.map((paragraph) => (
              <p key={paragraph}>{withEmail(paragraph, email)}</p>
            ))}
            {email && usesEmail && !showFallback ? (
              <p>
                <a href={`mailto:${email}`}>{email}</a>
              </p>
            ) : null}
          </section>
        );
      })}
    </article>
  );
}
