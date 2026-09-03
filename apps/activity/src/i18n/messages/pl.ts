import type { ActivityMessages } from "./en";

export const pl: ActivityMessages = {
  shell: {
    title: "Friends",
    subtitle: "Gra imprezowa dla osób, które już są na tym kanale Discord.",
    authBoot: "Otwieranie Discorda…",
    authAuthorizing: "Logowanie…",
    notConfigured: "Brakuje identyfikatora aplikacji Discord.",
    missingClientIdDev: "Ustaw VITE_DISCORD_CLIENT_ID w .env.development.",
    signInFailed: "Logowanie nie wyszło.",
    signInFailedDetail: "Zamknij Activity i otwórz je jeszcze raz z kanału.",
    genericError: "Coś padło. Otwórz Friends ponownie.",
  },
  lobby: {
    players: "W pokoju",
    host: "Host",
    you: "Ty",
    pickPack: "Wybierz paczkę",
    party: "Impreza",
    family: "Rodzina",
    colleagues: "Praca",
    spicy: "Ostre",
    start: "Zacznij mecz",
    waitingHost: "Czekamy, aż host zacznie.",
  },
  round: {
    vote: "Głosuj",
    skip: "Pomiń",
    complete: "Zrobione",
    reveal: "Pokaż wyniki",
    waitingReveal: "Czekamy na hosta, aż pokaże wyniki.",
    yourAnswer: "Twoja odpowiedź",
    next: "Następna runda",
  },
};
