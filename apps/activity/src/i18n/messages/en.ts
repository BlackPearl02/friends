export const en = {
  shell: {
    title: "Friends",
    subtitle: "A party game for whoever is already in this Discord channel.",
    authBoot: "Opening Discord…",
    authAuthorizing: "Signing you in…",
    notConfigured: "This Activity is missing its Discord app id.",
    missingClientIdDev: "Set VITE_DISCORD_CLIENT_ID in .env.development.",
    signInFailed: "Sign-in failed.",
    signInFailedDetail: "Close the Activity and open it again from the channel.",
    genericError: "Something broke. Try opening Friends again.",
  },
  lobby: {
    players: "In the room",
    host: "Host",
    you: "You",
    pickPack: "Pick a pack",
    party: "Party",
    family: "Family",
    colleagues: "Colleagues",
    spicy: "Spicy",
    start: "Start the match",
    waitingHost: "Waiting for the host to start.",
  },
  round: {
    vote: "Vote",
    skip: "Skip",
    complete: "I did it",
    reveal: "Reveal",
    waitingReveal: "Waiting for the host to reveal.",
    yourAnswer: "Your answer",
    next: "Next round",
  },
};

export type ActivityMessages = typeof en;
