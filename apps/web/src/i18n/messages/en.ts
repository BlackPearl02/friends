export const en = {
  meta: {
    siteName: "Squimbo",
    landingTitle: "Squimbo, a Discord party game",
    landingDescription:
      "Who knows the group best? Vote in the dark inside Discord. No join code.",
    privacyTitle: "Privacy Policy",
    privacyDescription:
      "How Rafał Szołtysik (Squimbo) processes Discord identity, game data, and website analytics under EU and US privacy law.",
    termsTitle: "Terms of Use",
    termsDescription:
      "Terms for using Squimbo operated by Rafał Szołtysik: eligibility, conduct, liability, and governing law.",
    supportTitle: "Support",
    supportDescription:
      "Get help with Squimbo on Discord. Troubleshooting tips and how to contact support.",
    ogImageAlt: "Squimbo — Discord party game cover art",
  },
  nav: {
    home: "Home",
    privacy: "Privacy",
    terms: "Terms",
    support: "Support",
  },
  landing: {
    brand: "Squimbo",
    label: "Discord Activity",
    headline: "Who knows the group best?",
    subhead:
      "A party game for Discord. Open the Activity, vote in the dark, then face the finale.",
    entityBlurb:
      "Squimbo is a Discord Activity party game for groups already in a voice channel. There is no join code: whoever opens the Activity is in. Players vote on “who is most likely” rounds with sealed tallies, then see scores only at the finale. It feels best with about 3 to 8 people.",
    cta: "Play on Discord",
    ctaFallback: "Open Discord",
    ctaSecondary: "See how it works",
    momentTitle: "Votes stay sealed.",
    momentBody:
      "Nobody sees the tally mid-round. When the last person locks in, the night moves on. The scoreboard waits for the finale.",
    prompts: [
      "Who is most likely to leave their mic unmuted during a private rant?",
      "Who is most likely to wave at someone who was waving at the person behind them?",
      "Who is most likely to get exposed by their browser tabs on screen share?",
      "Who is most likely to accidentally confess a crush while “just joking”?",
      "Who is most likely to still cringe at an awkward moment from years ago?",
      "Who is most likely to say “you too” when the waiter says enjoy your meal?",
      "Who is most likely to start a story with “don’t judge me” and then earn the judgment?",
      "Who is most likely to get roasted and laugh the hardest anyway?",
    ],
    howTitle: "How a night goes",
    howLead: "Three beats. Everyone plays. No host privileges.",
    step1Title: "Start in the channel",
    step1Body:
      "Open Squimbo in voice. Whoever joins is in. No join code, no extra apps.",
    step2Title: "Vote sealed",
    step2Body:
      "Each round asks who is most likely. Everyone picks someone else. Votes stay hidden until the last person locks in.",
    step3Title: "Score at the end",
    step3Body:
      "Keep going or wrap when the night feels done. The scoreboard waits for the finale, then play again.",
    fitTitle: "Built for the channel you already opened",
    fitBody:
      "Squimbo is a Discord Activity, not a separate app and not a lobby with codes. Your display names and avatars come with you. Best with about 3 to 8 people in voice.",
    fitPoint1: "No join code",
    fitPoint2: "Same controls for everyone",
    fitPoint3: "Scores only at the finale",
    spec1Label: "Players",
    spec1Value: "3 to 8 sweet spot",
    spec2Label: "Join",
    spec2Value: "No code needed",
    spec3Label: "Votes",
    spec3Value: "Sealed until lock-in",
    spec4Label: "Scores",
    spec4Value: "Finale only",
    faqTitle: "FAQ",
    faq1Q: "What is Squimbo?",
    faq1A:
      "Squimbo is a party game that runs as a Discord Activity. Your group opens it in a voice channel, votes on most likely rounds, and sees scores when you wrap the night.",
    faq2Q: "How many players do I need?",
    faq2A:
      "Squimbo needs at least two players to start. It feels best with about 3 to 8 people already in the channel.",
    faq3Q: "Do I need a join code?",
    faq3A:
      "No. Squimbo does not use a join code. Everyone who opens the Activity in that channel is in the same room.",
    faq4Q: "Is it a separate app?",
    faq4A:
      "No. Squimbo launches inside Discord on desktop and mobile. There is no extra install for the game itself.",
    closeBrand: "Squimbo",
    closeTitle: "Ready when the crew is.",
    closeBody: "Launch Squimbo from a Discord voice channel and start the first round.",
    closeCta: "Play on Discord",
  },
  footer: {
    tagline: "Party night as a Discord Activity.",
    privacy: "Privacy",
    terms: "Terms",
    support: "Support",
    cookies: "Cookies",
  },
  cookies: {
    title: "Cookies and analytics",
    body: "We use optional analytics (PostHog and Vercel Analytics) on this marketing site to understand traffic. They load only if you accept. Essential site cookies are not used for ads.",
    privacyLink: "Privacy Policy",
    accept: "Accept",
    reject: "Reject",
  },
  support: {
    title: "Support",
    intro:
      "Squimbo runs inside Discord. Most hiccups clear up when you reopen the Activity in the same channel.",
    howTitle: "Try this first",
    how1: "Leave the Activity and open it again in the same voice channel.",
    how2: "Wait until Discord has finished loading and you are connected to voice.",
    how3: "Ask everyone to refresh so you share one session.",
    contactTitle: "Contact",
    contactBody:
      "Write to {email} with a short description and roughly when it happened.",
    contactMissing:
      "A support email is not set yet. If you have repo access, open an issue. Otherwise message the app owner on Discord.",
  },
  privacy: {
    title: "Privacy Policy",
    updated: "Last updated: 15 September 2026",
    sections: [
      {
        title: "1. Who we are (data controller)",
        paragraphs: [
          "Squimbo is a Discord Activity party game and marketing website operated by Rafał Szołtysik, a sole proprietor established in Poland (NIP 9691672125), ul. Wolna 35, 44-187 Wielowieś, Poland (“we”, “us”, “operator”).",
          "For personal data processed in connection with Squimbo, Rafał Szołtysik is the controller under Regulation (EU) 2016/679 (GDPR) and the applicable Polish data protection law. This policy also explains how we handle privacy expectations for users in the United States.",
        ],
      },
      {
        title: "2. Scope",
        paragraphs: [
          "This policy covers (a) playing Squimbo inside Discord (the Activity and related game API), and (b) visiting squimbo.app or other Squimbo marketing pages we operate. Discord is a separate controller for Discord accounts, voice, and platform features. Your use of Discord is also governed by Discord’s own privacy policy and terms.",
        ],
      },
      {
        title: "3. Personal data we process",
        paragraphs: [
          "Depending on how you use Squimbo, we may process:",
        ],
        bullets: [
          "Discord identity used to run the game: Discord user id, display name, and avatar URL obtained through Discord’s OAuth / Embedded App authentication flow.",
          "Game and session data: Activity instance id, optional Discord channel/guild ids, room membership, round state, votes (who voted for whom), scores, player intent signals, and related timestamps.",
          "Technical session data: a short-lived Squimbo session token issued after Discord verifies your identity (used to authorize game API calls). We do not store Discord access or refresh tokens in game responses or on this website.",
          "Website analytics (marketing site only): page views, approximate device/browser information, referrer, and related product-analytics events via PostHog (EU cloud) and Vercel Analytics. Session replay may be enabled for marketing pages where configured.",
          "Support correspondence: if you email us, the content of your message and contact details you provide.",
        ],
      },
      {
        title: "4. Purposes and legal bases (EEA / UK / Switzerland)",
        paragraphs: [
          "We process personal data for these purposes and GDPR legal bases:",
        ],
        bullets: [
          "Providing the Activity (sign-in after Discord verification, room membership, voting, scoring, session continuity) — Art. 6(1)(b) GDPR (performance of a contract / steps requested by you to use the service).",
          "Operating, securing, and troubleshooting the service (abuse prevention, integrity of votes/rooms, service reliability) — Art. 6(1)(f) GDPR (legitimate interests). You may object where applicable.",
          "Website analytics and product improvement on marketing pages — Art. 6(1)(f) GDPR (legitimate interests) and, where required by ePrivacy / local cookie rules for non-essential cookies or similar technologies (including certain analytics or session replay), Art. 6(1)(a) GDPR (consent).",
          "Responding to support or privacy requests — Art. 6(1)(b) or (f) GDPR, and Art. 6(1)(c) where we must comply with a legal obligation.",
          "Complying with law, enforcing terms, or establishing/defending legal claims — Art. 6(1)(c) and/or (f) GDPR.",
        ],
      },
      {
        title: "5. Sharing and processors",
        paragraphs: [
          "We do not sell personal data and we do not share game data with advertisers. We use service providers that process data on our instructions to run Squimbo, including:",
        ],
        bullets: [
          "Discord Inc. / Discord affiliates — identity verification and hosting the Activity inside Discord.",
          "Vercel Inc. — hosting of the marketing site and related infrastructure / analytics.",
          "PostHog (EU region where configured) — product analytics for the marketing site.",
          "Database and infrastructure hosts for the game API and PostgreSQL storage (configured for production deployment).",
        ],
        paragraphsAfterBullets: [
          "These providers may process data in the EU and/or other countries where they operate. Where a transfer outside the EEA/UK occurs, we rely on appropriate safeguards such as the provider’s Standard Contractual Clauses or an adequacy decision, as applicable.",
        ],
      },
      {
        title: "6. Retention",
        paragraphs: [
          "We keep personal data only as long as needed for the purposes above:",
        ],
        bullets: [
          "User profile fields tied to Discord identity (discord id, display name, avatar URL): retained while you may return to play and for ongoing product features that rely on history; deleted or anonymized on a verified deletion request unless we must retain a subset for legal claims or compliance.",
          "Rooms, rounds, votes, and scores: retained to operate sessions and preserve game history (including future product features such as profiles). You may request deletion of your linked history.",
          "Squimbo session tokens: short-lived; expire according to our API configuration.",
          "Marketing analytics: retained according to our PostHog / Vercel retention settings (typically up to 12–24 months unless deleted earlier).",
          "Support emails: typically up to 24 months after the last message, unless a longer period is needed for an ongoing matter.",
        ],
      },
      {
        title: "7. Security",
        paragraphs: [
          "We use technical and organizational measures appropriate to the risk, including HTTPS in transit, server-side authorization for game actions (membership / session checks), minimized API responses, and short-lived session tokens minted only after Discord verifies identity. No method of transmission or storage is perfectly secure.",
        ],
      },
      {
        title: "8. Your rights (EEA / UK / Switzerland)",
        paragraphs: [
          "Subject to GDPR and local law, you may have the right to access, rectify, erase, restrict, or port your personal data, and to object to processing based on legitimate interests. Where processing is based on consent, you may withdraw consent at any time without affecting prior lawful processing.",
          "To exercise these rights, contact us using the details below. You also have the right to lodge a complaint with a supervisory authority. In Poland, that is the President of the Personal Data Protection Office (UODO), ul. Stawki 2, 00-193 Warsaw, Poland (uodo.gov.pl). You may also contact the authority in your country of residence.",
        ],
      },
      {
        title: "9. United States privacy notice",
        paragraphs: [
          "If you are a resident of a US state with a comprehensive privacy law (including California under the CCPA/CPRA, and similar laws in states such as Virginia, Colorado, Connecticut, Utah, and others as they apply), we provide the following notice.",
          "Categories of personal information collected in the last 12 months may include identifiers (Discord user id, display name), internet / network activity (site analytics), and inferences are not used to profile you for advertising. We collect this information from you (via Discord auth and your use of the Activity/site) and from our analytics providers.",
          "We use personal information to provide Squimbo, secure the service, communicate about support requests, and understand marketing-site usage. We do not sell personal information and we do not “share” it for cross-context behavioral advertising as those terms are defined under California law. We do not use or disclose sensitive personal information for purposes that require a right to limit under the CPRA, beyond what is necessary to provide the service.",
          "Depending on your state, you may have rights to know/access, delete, correct, and obtain a portable copy of certain personal information, and to appeal a denied request. We will not discriminate against you for exercising privacy rights. Submit requests to the contact email below. We may need to verify your identity (for Discord-linked data, we may ask you to demonstrate control of the relevant Discord account or provide enough detail to locate your records). Authorized agents may submit requests where state law allows, subject to verification.",
        ],
      },
      {
        title: "10. Children",
        paragraphs: [
          "Squimbo is intended for users who are allowed to use Discord and to participate in the channel where the Activity is launched. We do not knowingly collect personal data from children in violation of applicable law (including COPPA in the United States or age rules under GDPR). If you believe a child has provided us data unlawfully, contact us and we will take appropriate steps.",
        ],
      },
      {
        title: "11. Cookies and similar technologies",
        paragraphs: [
          "The marketing site may use essential technologies needed to deliver pages. Optional analytics tools (PostHog and Vercel Analytics) can involve cookies, local storage, or similar identifiers. Those analytics load only after you accept via our cookie banner. You can change your choice anytime using Cookies in the site footer. Rejecting analytics does not block browsing this website.",
          "The Discord Activity runs inside Discord’s client; Discord may use its own technologies subject to Discord’s policies.",
        ],
      },
      {
        title: "12. Contact",
        paragraphs: [
          "Privacy questions and data-subject requests: {email}. Postal address: Rafał Szołtysik, ul. Wolna 35, 44-187 Wielowieś, Poland.",
        ],
      },
      {
        title: "13. Changes",
        paragraphs: [
          "We may update this Privacy Policy from time to time. The “Last updated” date at the top will change when we do. Material changes may also be highlighted on the website or within the Activity where practical. Continued use after an update means you acknowledge the revised policy, except where consent is required by law.",
        ],
      },
    ],
    contactFallback:
      "Privacy questions and data-subject requests: use the contact options on the Support page. Postal address: Rafał Szołtysik, ul. Wolna 35, 44-187 Wielowieś, Poland.",
  },
  terms: {
    title: "Terms of Use",
    updated: "Last updated: 15 September 2026",
    sections: [
      {
        title: "1. Operator",
        paragraphs: [
          "Squimbo is operated by Rafał Szołtysik, sole proprietor, ul. Wolna 35, 44-187 Wielowieś, Poland, NIP 9691672125 (“we”, “us”, “operator”). These Terms of Use (“Terms”) govern your access to and use of the Squimbo Discord Activity, related game APIs, and the Squimbo marketing website.",
        ],
      },
      {
        title: "2. The service",
        paragraphs: [
          "Squimbo is a party game that runs as a Discord Activity. Groups already in a Discord channel can open the Activity, play “most likely” style rounds with sealed votes, and see scores at the finale. There is no separate join code: the Discord Activity instance identifies the room.",
          "Squimbo is not affiliated with Discord Inc., except that it runs on Discord’s Activity platform. Squimbo is also not affiliated with third-party mobile party games that may offer a similar genre.",
        ],
      },
      {
        title: "3. Agreement and Discord terms",
        paragraphs: [
          "By accessing or using Squimbo, you agree to these Terms and to Discord’s terms and policies that apply to Activities and your Discord account (including Discord’s Terms of Service and Community Guidelines). If you do not agree, do not use Squimbo.",
        ],
      },
      {
        title: "4. Eligibility",
        paragraphs: [
          "You must be allowed to use Discord and to join the channel where Squimbo is launched. You must comply with all applicable laws. If you use Squimbo on behalf of an organization, you represent that you have authority to bind that organization.",
        ],
      },
      {
        title: "5. Accounts and identity",
        paragraphs: [
          "Squimbo authenticates players through Discord’s Embedded App / OAuth flow. We create or update a Squimbo user record linked to your Discord identity to run rooms, votes, and scores. You are responsible for activity that occurs through your Discord account while using Squimbo.",
        ],
      },
      {
        title: "6. Acceptable use",
        paragraphs: [
          "You agree not to:",
        ],
        bullets: [
          "Harass, threaten, or abuse other players, or use Squimbo to distribute illegal, hateful, or otherwise prohibited content.",
          "Interfere with rooms you are not invited to, disrupt gameplay, manipulate votes through automated means, or attempt unauthorized access to accounts, rooms, or systems.",
          "Scrape, copy, or harvest prompts, player data, or APIs at scale without our prior written permission.",
          "Reverse engineer, attack, or overload the service except to the limited extent mandatory law allows interoperability research.",
          "Misrepresent your identity or affiliation in a way that harms others or the service.",
        ],
      },
      {
        title: "7. Intellectual property",
        paragraphs: [
          "Squimbo branding, original prompt content, software, and site materials are owned by the operator or its licensors. You receive a limited, revocable, non-exclusive, non-transferable license to use Squimbo only as provided through Discord and our websites, for personal, non-commercial entertainment, subject to these Terms.",
          "You may not copy, redistribute, or commercially exploit Squimbo content outside the permitted Discord Activity experience without prior written consent.",
        ],
      },
      {
        title: "8. Availability and changes",
        paragraphs: [
          "Squimbo is provided on an “as is” and “as available” basis. Sessions may end, prompts may change, features may be added or removed, and the service may experience downtime (including Discord platform outages outside our control). We may modify or discontinue Squimbo at any time.",
        ],
      },
      {
        title: "9. Disclaimers",
        paragraphs: [
          "To the fullest extent permitted by law, we disclaim all warranties, express or implied, including merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that Squimbo will be uninterrupted, error-free, or that scores or session state will never be lost.",
        ],
      },
      {
        title: "10. Limitation of liability",
        paragraphs: [
          "To the fullest extent permitted by applicable law, the operator shall not be liable for any indirect, incidental, special, consequential, exemplary, or punitive damages, or for lost profits, lost data, lost scores, or business interruption, arising out of or related to Squimbo or these Terms, whether based in contract, tort, or otherwise.",
          "To the fullest extent permitted by law, our aggregate liability for all claims relating to Squimbo or these Terms shall not exceed the greater of (a) EUR 50 or (b) the amounts you paid us for Squimbo (if any) in the twelve months before the claim. Because Squimbo is currently offered without a separate paid fee through Discord, subpart (a) typically applies.",
          "Nothing in these Terms excludes or limits liability that cannot be excluded under mandatory law (including liability for death or personal injury caused by negligence, or fraud). If you are a consumer in the European Union or United Kingdom, you keep mandatory statutory rights that cannot be waived.",
        ],
      },
      {
        title: "11. US consumers",
        paragraphs: [
          "If you access Squimbo from the United States, you use it voluntarily as an entertainment service delivered through Discord. Some US states do not allow certain warranty disclaimers or liability limits; in those jurisdictions, our liability is limited to the maximum extent permitted by law. You may also have rights under state privacy laws described in our Privacy Policy.",
        ],
      },
      {
        title: "12. Indemnity",
        paragraphs: [
          "To the extent permitted by law, you agree to indemnify and hold harmless the operator from claims, damages, losses, and expenses (including reasonable legal fees) arising out of your misuse of Squimbo, your violation of these Terms, or your violation of Discord’s rules or applicable law.",
        ],
      },
      {
        title: "13. Suspension and termination",
        paragraphs: [
          "We may suspend or terminate access to Squimbo (including specific rooms or users) if we reasonably believe you violated these Terms, Discord’s rules, or applicable law, or if needed to protect the service or other players. You may stop using Squimbo at any time. Provisions that by nature should survive (including IP, disclaimers, liability limits, indemnity, and governing law) survive termination.",
        ],
      },
      {
        title: "14. Governing law and disputes",
        paragraphs: [
          "These Terms are governed by the laws of Poland, without regard to conflict-of-law rules, except that mandatory consumer protections of your country of residence remain available where they cannot be waived.",
          "Courts of Poland shall have jurisdiction, subject to mandatory consumer venue rules that may allow you to bring proceedings in your place of residence (especially if you are an EU/EEA consumer).",
          "If you are a US resident, you and we agree to attempt to resolve disputes informally by contacting us first. Nothing here prevents either party from seeking interim relief for IP misuse or unauthorized access.",
        ],
      },
      {
        title: "15. Changes to these Terms",
        paragraphs: [
          "We may update these Terms from time to time. The “Last updated” date will change when we do. If you continue using Squimbo after an update becomes effective, you accept the revised Terms, except where additional consent is required by law.",
        ],
      },
      {
        title: "16. Contact",
        paragraphs: [
          "Questions about these Terms: {email}. Postal address: Rafał Szołtysik, ul. Wolna 35, 44-187 Wielowieś, Poland.",
        ],
      },
    ],
    contactFallback:
      "Questions about these Terms: see the Support page. Postal address: Rafał Szołtysik, ul. Wolna 35, 44-187 Wielowieś, Poland.",
  },
  errors: {
    notFound: {
      code: "404",
      title: "This page left the channel.",
      body: "Head home or open Squimbo in Discord.",
      home: "Home",
      playCta: "Play on Discord",
    },
    unexpected: {
      code: "Error",
      title: "Something broke mid-round.",
      body: "Try again, or bounce back home.",
      retry: "Try again",
      home: "Home",
      playCta: "Play on Discord",
    },
  },
} as const;
