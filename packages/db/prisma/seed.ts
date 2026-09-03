import { PrismaClient, type PromptCategory, type PromptKind } from "@prisma/client";

const prisma = new PrismaClient();

type SeedPrompt = {
  kind: PromptKind;
  category: PromptCategory;
  locale: "en" | "pl";
  body: string;
  optionA?: string;
  optionB?: string;
};

const prompts: SeedPrompt[] = [
  { kind: "most_likely", category: "party", locale: "en", body: "Who is most likely to start a group chat at 2am?" },
  { kind: "most_likely", category: "party", locale: "pl", body: "Kto najpewniej założy grupę o drugiej w nocy?" },
  { kind: "most_likely", category: "family", locale: "en", body: "Who is most likely to bring snacks for everyone else?" },
  { kind: "most_likely", category: "family", locale: "pl", body: "Kto najpewniej przyniesie przekąski dla wszystkich?" },
  { kind: "most_likely", category: "colleagues", locale: "en", body: "Who is most likely to reply-all by accident?" },
  { kind: "most_likely", category: "colleagues", locale: "pl", body: "Kto najpewniej kliknie „odpowiedz wszystkim” przez pomyłkę?" },
  { kind: "most_likely", category: "spicy", locale: "en", body: "Who is most likely to have a crush they still have not admitted?" },
  { kind: "most_likely", category: "spicy", locale: "pl", body: "Kto najpewniej ma crusha, którego jeszcze nie wyznał?" },
  { kind: "this_or_that", category: "party", locale: "en", body: "Tonight you would rather…", optionA: "Dance badly on purpose", optionB: "DJ from your phone" },
  { kind: "this_or_that", category: "party", locale: "pl", body: "Dziś wieczór wolisz…", optionA: "Tańczyć źle, ale z przytupem", optionB: "Puścić playlistę z telefonu" },
  { kind: "this_or_that", category: "family", locale: "en", body: "Weekend plan:", optionA: "Board games at home", optionB: "A too-long walk" },
  { kind: "this_or_that", category: "family", locale: "pl", body: "Plan na weekend:", optionA: "Planszówki w domu", optionB: "Za długi spacer" },
  { kind: "truth", category: "party", locale: "en", body: "What is a hill you will die on about pizza?" },
  { kind: "truth", category: "party", locale: "pl", body: "W jakiej sprawie o pizzy nie ustąpisz?" },
  { kind: "truth", category: "colleagues", locale: "en", body: "What Slack habit of yours would your teammates roast?" },
  { kind: "truth", category: "colleagues", locale: "pl", body: "Jaki nawyk na Slacku wytknęliby ci koledzy?" },
  { kind: "challenge", category: "party", locale: "en", body: "Do your best impression of the person to your left (10 seconds)." },
  { kind: "challenge", category: "party", locale: "pl", body: "Zrób najlepszą imitację osoby po lewej (10 sekund)." },
  { kind: "challenge", category: "family", locale: "en", body: "Compliment two people in this room without using the word nice." },
  { kind: "challenge", category: "family", locale: "pl", body: "Pochwal dwie osoby w pokoju bez słowa „fajny/fajna”." },
];

async function main() {
  const count = await prisma.prompt.count();
  if (count > 0) {
    console.log(`Prompts already seeded (${count}). Skip.`);
    return;
  }
  await prisma.prompt.createMany({ data: prompts });
  console.log(`Seeded ${prompts.length} prompts.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
