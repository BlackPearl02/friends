import { PrismaClient, type PromptKind } from "@prisma/client";

const prisma = new PrismaClient();

type SeedPrompt = {
  kind: PromptKind;
  locale: "en";
  body: string;
};

/**
 * MVP most_likely bank — English only.
 * Polish prompt rows return later on purpose (roadmap), not in MVP.
 */
const prompts: SeedPrompt[] = [
  { kind: "most_likely", locale: "en", body: "Who is most likely to start a group chat at 2am?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to bring snacks for everyone else?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to reply-all by accident?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to have a crush they still have not admitted?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to share their screen with the wrong tab open?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to ghost the group chat for three days then drop a meme?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to plan a hangout and then be late?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to fall asleep on voice chat?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to order food for the whole squad without asking?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to start an argument about pineapple on pizza?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to know everyone’s Discord status but not their own schedule?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to take a photo of the group and never send it?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to say “one more game” and mean five?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to overshare a spicy story mid-round?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to rage-quit… then rejoin thirty seconds later?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to become the unofficial party photographer?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to send a voice note longer than five minutes?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to know the lore of every mutual friend?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to turn a five-minute story into a TED Talk?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to flirt by “accidentally” liking an old photo?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to become famous first?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to survive a zombie apocalypse… by hiding?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to forget their own birthday plans?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to buy a plant and name it?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to start a podcast and record one episode?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to get lost in a city they claim to know?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to cry at a cartoon?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to join the wrong voice channel and stay?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to spend rent money on a limited sneaker drop?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to adopt a chaotic pet energy?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to become the group’s therapist for a night?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to invent a nickname that sticks forever?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to win an argument they were wrong about?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to disappear for a week with no explanation?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to become rich in the most chaotic way?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to host and then ask where the snacks are?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to screenshot the chat for later drama?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to fall for a phishing email first?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to become the funniest person in the room tonight?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to start dancing with zero music?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to keep a secret for approximately twelve minutes?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to get promoted… and still complain about Mondays?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to bring the group back together after a fight?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to become a main character in someone else’s story?" },
];

async function main() {
  const force = process.argv.includes("--force");
  if (force && process.env.NODE_ENV === "production") {
    throw new Error("Refusing --force seed in production");
  }

  if (force) {
    const referenced = await prisma.round.findMany({
      select: { promptId: true },
      distinct: ["promptId"],
    });
    const referencedIds = referenced.map((r) => r.promptId);
    const deleted = await prisma.prompt.deleteMany(
      referencedIds.length > 0 ? { where: { id: { notIn: referencedIds } } } : undefined,
    );
    console.log(`Force seed: deleted ${deleted.count} unreferenced prompts.`);
  } else {
    const count = await prisma.prompt.count();
    if (count > 0) {
      console.log(`Prompts already seeded (${count}). Skip. Use --force locally to replace.`);
      return;
    }
  }

  const created = await prisma.prompt.createMany({ data: prompts, skipDuplicates: true });
  const total = await prisma.prompt.count();
  console.log(`Seeded ${created.count} new prompts (bank size ${total}, list ${prompts.length}).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
