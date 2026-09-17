# Documentation style

Write like a person who maintains the project. Concrete, readable, practical. Not like generated copy.

## Language

Natural, contemporary. Not stiff, not marketing, not fake-corporate.

Do not add information you were not given. Do not invent features, dependencies, config, commands, app behavior, licenses, authors, or technical details.

If a fact is missing, say so or ask a specific question. Do not guess.

Each sentence needs a job. Delete sentences that only sound professional.

Prefer short and medium sentences. Write directly.

Instead of: "The project was created in order to enable users to..."
Write: "The project lets you..." / "Projekt pozwala..."

Instead of: "In order to start the application it is necessary to..."
Write: "To start the app, run..." / "Aby uruchomić aplikację, wykonaj..."

Instead of: "If you would like to take advantage of..."
Write: "To use..." / "Aby użyć..."

Do not repeat the same fact in several sections.

Do not explain the obvious.

Do not add a summary at the end of every section.

Do not add a section just because README templates usually have it.

English engineering docs: simple technical English.

Prefer: "Install the dependencies."
Not: "To facilitate the installation process, users are required to install the necessary dependencies."

Prefer: "The application reads configuration from `.env`."
Not: "The application is designed to leverage environment-based configuration management."

Polish docs (only when the user asked for Polish): natural Polish used by developers. Do not force-translate terms that stay English in practice.

## Banned phrases

Do not use:

- "W tym dokumencie znajdziesz..."
- "Niniejszy projekt ma na celu..."
- "Wychodząc naprzeciw potrzebom..."
- "Zapewnia kompleksowe rozwiązanie..."
- "Dzięki temu użytkownicy mogą..."
- "Kluczowe funkcjonalności obejmują..."
- "Projekt został zaprojektowany z myślą o..."
- "Warto zauważyć, że..."
- "Należy podkreślić, że..."
- "Bezproblemowa integracja..."
- "Intuicyjne i przyjazne rozwiązanie..."
- "Nowoczesne, skalowalne i wydajne rozwiązanie..."
- "Wykorzystuje najnowsze technologie..."
- "W erze cyfrowej..."
- "Ten projekt stanowi..."
- "Mamy nadzieję, że..."
- "Serdecznie zapraszamy do..."
- "Dołącz do naszej społeczności..."

English equivalents are also banned: "this document will walk you through", "aims to provide", "comprehensive solution", "seamless integration", "intuitive and user-friendly", "modern, scalable, and performant", "leverages cutting-edge", "in the digital era", "we hope that", "join our community".

Do not use empty adjectives. Instead of "a fast, modern, scalable solution", say what the project does and under what conditions it runs.

## Formatting

GitHub-flavored Markdown.

Headings only when they actually organize the page.

Commands, file names, env vars, paths, classes, functions, and config values in backticks.

Longer code in fenced blocks with a language tag.

Lists when they help scanning. Do not turn the whole page into a list.

No emoji.

No em dash or en dash. Do not use "—" or "–". Use a period, comma, colon, parentheses, or a hyphen "-" where that is correct.

No decorative Markdown.

Do not use ALL CAPS to fake emphasis.

## README

Pick a structure that fits this project. Typical sections, use only what applies:

```markdown
# Project name

What it is and what it is for.

## Features

Only real features.

## Requirements

What you need to run it.

## Installation

Concrete steps.

## Usage

Real usage.

## Configuration

Env and config, if the project has them.

## Development

What a contributor needs locally.

## Testing

How to run tests, if tests exist.

## License

The actual license.
```

Do not add all of these by default.

## Technical docs

Answer a concrete user or developer question.

Cover, when relevant:

- what the function or flow does
- what it accepts
- what it returns
- limits
- requirements
- usage examples
- errors that can happen

Do not describe implementation unless it is needed to understand or use the thing.

API docs: real endpoints, HTTP methods, parameters, responses, examples.

Config docs: real variable names, value types, defaults, required settings.

## CONTRIBUTING

Describe how this repo actually works. Include only what exists here, for example:

- local setup
- how to run the project
- tests
- formatting
- branching
- pull requests
- bug reports
- commit requirements

Do not invent process to look complete. Squimbo already documents PRs into `dev`, conventional commits, `pnpm test`, secrets, and i18n in `CONTRIBUTING.md`.

## LICENSE

Do not write a homemade license from a vague description.

Identify the license first.

If the user names a license, use that license’s standard text and required fields. Do not rewrite the legal wording.

Do not present your own text as an official license.

If required fields are missing (copyright holder, year), ask.

This repository’s license file is MIT. Do not change it unless the user explicitly asks.

## Anti-AI pass

Before returning the text, remove:

- repetitive sentence patterns
- fake introductions
- marketing adjectives
- pointless summaries
- obvious statements
- overly formal filler
- sentences that add nothing
- repeated information
- unsupported claims
- invented details

Natural tone comes from plain language, specifics, and the right context. Do not add slang, typos, or fake imperfections to sound human.

## Override

Correctness and usefulness beat length, impressiveness, and formality.

If one sentence is enough, use one sentence.

If an example is clearer than a paragraph, use the example.

If you do not know, do not guess.

If it is unused, delete it.

## QA checklist

1. Is every fact backed by the repo or the user?
2. Can someone scan the page quickly?
3. Does a reader know what to do next?
4. Does it sound generated?
5. Is there leftover marketing?
6. Are there repeats?
7. Any emoji?
8. Any em dash or en dash?
9. Any invented features or details?
10. Is the Markdown valid on GitHub?

Return only the finished document, unless the user also asked for an explanation of changes or assumptions.
