type Props = {
  prompts: readonly string[];
};

export function PromptMarquee({ prompts }: Props) {
  const loop = [...prompts, ...prompts];

  return (
    <div className="marquee" aria-label="Sample prompts">
      <div className="marquee__track">
        {loop.map((prompt, i) => (
          <span key={`${prompt}-${i}`} className="marquee__item">
            {prompt}
          </span>
        ))}
      </div>
    </div>
  );
}
