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

  // Secondhand embarrassment / soft-confession fuel — party roast, not harassment.
  { kind: "most_likely", locale: "en", body: "Who is most likely to wave at someone who was waving at the person behind them?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to say “you too” when the waiter says enjoy your meal?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to walk into a glass door and act like it was a bit?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to like their own selfie by accident… then unlike it too late?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to leave their mic unmuted during a private rant?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to get caught singing when they thought they were muted?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to have an embarrassing notification pop up on the shared screen?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to get exposed by their browser tabs on screen share?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to rehearse a “casual” text for twenty minutes?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to send a risky message to the wrong person?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to still check if a crush viewed their story?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to accidentally confess a crush while “just joking”?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to have a draft message they will never send?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to text “haha” and then overthink it for an hour?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to have a secret playlist named after someone in this call?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to get friend-zoned and call it a plot twist?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to pretend they didn’t see someone they know in public?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to laugh at a joke they definitely did not understand?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to mispronounce a common word with full confidence?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to wave goodbye and then walk the same direction as everyone?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to still cringe at an awkward moment from years ago?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to have a cringe phase fully documented in photos?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to get stuck in the group lore as “that one time”?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to spill a drink and blame gravity?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to trip over absolutely nothing in public?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to get nervous and start talking way too loud?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to get nervous laughter at the worst possible moment?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to say “I’m fine” while clearly not fine?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to leave a voice note and regret every second of it?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to have unread DMs they’re too scared to open?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to Google themselves more than they admit?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to blush when someone says their full name?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to get roasted for their typing quirks?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to pretend they knew a song they’ve never heard?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to have the most awkward first-date story ready to go?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to get called out for their “seen” habit?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to still answer to an embarrassing childhood nickname?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to cry during a commercial and swear it was allergies?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to have cried over a game loss this year?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to get caught mid-yawn on camera?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to send a paragraph then panic-delete mid-send?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to get roasted and laugh the hardest anyway?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to have a crush on a fictional character they refuse to name?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to practice their dating-app bio out loud?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to get clocked for their “I’m just checking something” lie?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to have an autocorrect fail still living in the group chat?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to rehearse an argument in the shower?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to get stuck explaining a meme until it dies?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to clap when the plane lands… alone?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to say “same” to a story that was not about them?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to get caught peeping at their own reflection mid-call?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to overexplain a simple joke until nobody is laughing?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to have the loudest “I wasn’t listening, can you repeat that?” energy?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to get flustered when someone compliments them for real?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to still think about a text they sent three years ago?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to accidentally hit “react” with the worst possible emoji?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to get called out for lurking in a chat without typing?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to have a “this is fine” face while everything is on fire?" },
  { kind: "most_likely", locale: "en", body: "Who is most likely to start a story with “don’t judge me” and then earn the judgment?" },
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
