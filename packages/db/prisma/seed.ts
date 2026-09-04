import { PrismaClient, type PromptKind } from "@prisma/client";

const prisma = new PrismaClient();

type SeedPrompt = {
  kind: PromptKind;
  locale: "en" | "pl";
  body: string;
};

/** Original most_likely bank — en/pl pairs for the viral MVP loop (~45 unique). */
const prompts: SeedPrompt[] = [
  { kind: "most_likely", locale: "en", body: "Who is most likely to start a group chat at 2am?" },
  { kind: "most_likely", locale: "pl", body: "Kto najpewniej założy grupę o drugiej w nocy?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to bring snacks for everyone else?" },
  { kind: "most_likely", locale: "pl", body: "Kto najpewniej przyniesie przekąski dla wszystkich?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to reply-all by accident?" },
  { kind: "most_likely", locale: "pl", body: "Kto najpewniej kliknie „odpowiedz wszystkim” przez pomyłkę?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to have a crush they still have not admitted?" },
  { kind: "most_likely", locale: "pl", body: "Kto najpewniej ma crusha, którego jeszcze nie wyznał?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to share their screen with the wrong tab open?" },
  { kind: "most_likely", locale: "pl", body: "Kto najpewniej udostępni ekran z niewłaściwą kartą?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to ghost the group chat for three days then drop a meme?" },
  { kind: "most_likely", locale: "pl", body: "Kto najpewniej zniknie z czatu na trzy dni i wróci z memem?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to plan a hangout and then be late?" },
  { kind: "most_likely", locale: "pl", body: "Kto najpewniej zorganizuje spotkanie i potem się spóźni?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to fall asleep on voice chat?" },
  { kind: "most_likely", locale: "pl", body: "Kto najpewniej zaśnie na voice chacie?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to order food for the whole squad without asking?" },
  { kind: "most_likely", locale: "pl", body: "Kto najpewniej zamówi jedzenie dla całej ekipy bez pytania?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to start an argument about pineapple on pizza?" },
  { kind: "most_likely", locale: "pl", body: "Kto najpewniej zacznie kłótnię o ananasa na pizzy?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to know everyone’s Discord status but not their own schedule?" },
  { kind: "most_likely", locale: "pl", body: "Kto najpewniej zna statusy wszystkich na Discordzie, ale nie swój grafik?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to take a photo of the group and never send it?" },
  { kind: "most_likely", locale: "pl", body: "Kto najpewniej zrobi zdjęcie grupy i nigdy go nie wyśle?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to say “one more game” and mean five?" },
  { kind: "most_likely", locale: "pl", body: "Kto najpewniej powie „jeszcze jedną” i będzie miał na myśli pięć?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to overshare a spicy story mid-round?" },
  { kind: "most_likely", locale: "pl", body: "Kto najpewniej wygada ostrą historię w środku rundy?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to rage-quit… then rejoin thirty seconds later?" },
  { kind: "most_likely", locale: "pl", body: "Kto najpewniej wyjdzie w nerwach… i wróci po trzydziestu sekundach?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to become the unofficial party photographer?" },
  { kind: "most_likely", locale: "pl", body: "Kto najpewniej zostanie nieoficjalnym fotografem imprezy?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to send a voice note longer than five minutes?" },
  { kind: "most_likely", locale: "pl", body: "Kto najpewniej wyśle notatkę głosową dłuższą niż pięć minut?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to know the lore of every mutual friend?" },
  { kind: "most_likely", locale: "pl", body: "Kto najpewniej zna lore każdego wspólnego znajomego?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to turn a five-minute story into a TED Talk?" },
  { kind: "most_likely", locale: "pl", body: "Kto najpewniej zamieni pięciominutową historię w TED Talk?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to flirt by “accidentally” liking an old photo?" },
  { kind: "most_likely", locale: "pl", body: "Kto najpewniej będzie flirtować przez „przypadkowe” lajkowanie starego zdjęcia?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to become famous first?" },
  { kind: "most_likely", locale: "pl", body: "Kto najpewniej pierwszy zostanie sławny?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to survive a zombie apocalypse… by hiding?" },
  { kind: "most_likely", locale: "pl", body: "Kto najpewniej przeżyje zombie apocalypse… chowając się?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to forget their own birthday plans?" },
  { kind: "most_likely", locale: "pl", body: "Kto najpewniej zapomni o planach na własne urodziny?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to buy a plant and name it?" },
  { kind: "most_likely", locale: "pl", body: "Kto najpewniej kupi roślinę i da jej imię?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to start a podcast and record one episode?" },
  { kind: "most_likely", locale: "pl", body: "Kto najpewniej założy podcast i nagra jeden odcinek?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to get lost in a city they claim to know?" },
  { kind: "most_likely", locale: "pl", body: "Kto najpewniej zgubi się w mieście, które „zna na wylot”?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to cry at a cartoon?" },
  { kind: "most_likely", locale: "pl", body: "Kto najpewniej wzruszy się przy bajce?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to join the wrong voice channel and stay?" },
  { kind: "most_likely", locale: "pl", body: "Kto najpewniej wejdzie na zły voice i zostanie?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to spend rent money on a limited sneaker drop?" },
  { kind: "most_likely", locale: "pl", body: "Kto najpewniej wyda czynsz na limitowane sneakersy?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to adopt a chaotic pet energy?" },
  { kind: "most_likely", locale: "pl", body: "Kto najpewniej wniósłby do domu chaos zwierzęcego energy?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to become the group’s therapist for a night?" },
  { kind: "most_likely", locale: "pl", body: "Kto najpewniej zostanie terapeutą grupy na jedną noc?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to invent a nickname that sticks forever?" },
  { kind: "most_likely", locale: "pl", body: "Kto najpewniej wymyśli ksywkę, która zostanie na zawsze?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to win an argument they were wrong about?" },
  { kind: "most_likely", locale: "pl", body: "Kto najpewniej wygra kłótnię, w której nie miał racji?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to disappear for a week with no explanation?" },
  { kind: "most_likely", locale: "pl", body: "Kto najpewniej zniknie na tydzień bez wyjaśnienia?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to become rich in the most chaotic way?" },
  { kind: "most_likely", locale: "pl", body: "Kto najpewniej wzbogaci się w najbardziej chaotyczny sposób?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to host and then ask where the snacks are?" },
  { kind: "most_likely", locale: "pl", body: "Kto najpewniej będzie hostem i zapyta, gdzie są przekąski?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to screenshot the chat for later drama?" },
  { kind: "most_likely", locale: "pl", body: "Kto najpewniej zrobi screenshot czatu „na później”?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to fall for a phishing email first?" },
  { kind: "most_likely", locale: "pl", body: "Kto najpewniej pierwszy kliknie w phishing?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to become the funniest person in the room tonight?" },
  { kind: "most_likely", locale: "pl", body: "Kto najpewniej będzie dziś najzabawniejszą osobą w pokoju?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to start dancing with zero music?" },
  { kind: "most_likely", locale: "pl", body: "Kto najpewniej zacznie tańczyć bez żadnej muzyki?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to keep a secret for approximately twelve minutes?" },
  { kind: "most_likely", locale: "pl", body: "Kto najpewniej utrzyma sekret przez mniej więcej dwanaście minut?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to get promoted… and still complain about Mondays?" },
  { kind: "most_likely", locale: "pl", body: "Kto najpewniej dostanie awans… i nadal będzie narzekał na poniedziałki?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to bring the group back together after a fight?" },
  { kind: "most_likely", locale: "pl", body: "Kto najpewniej zjedna grupę po kłótni?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to become a main character in someone else’s story?" },
  { kind: "most_likely", locale: "pl", body: "Kto najpewniej zostanie główną postacią w czyjejś historii?" },
];

async function main() {
  const force = process.argv.includes("--force");
  if (force && process.env.NODE_ENV === "production") {
    throw new Error("Refusing --force seed in production");
  }

  if (force) {
    const deleted = await prisma.prompt.deleteMany({});
    console.log(`Force seed: deleted ${deleted.count} prompts.`);
  } else {
    const count = await prisma.prompt.count();
    if (count > 0) {
      console.log(`Prompts already seeded (${count}). Skip. Use --force locally to replace.`);
      return;
    }
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
