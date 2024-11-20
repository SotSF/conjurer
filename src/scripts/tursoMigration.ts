import { GetObjectCommand, ListObjectsCommand } from "@aws-sdk/client-s3";
import { getS3 } from "../utils/s3";
import { getLocalDatabase } from "../db/local";
import * as schema from "../db/schema";

const ASSET_BUCKET_NAME = "brollin-assets";
const EXPERIENCE_ASSET_PREFIX = "conjurer-experiences/";

const songMap: Record<
  string,
  {
    artist: string;
    song: string;
  }
> = {
  "1-02 Opening - Bombing Mission.m4a": {
    artist: "Nobuo Uematsu",
    song: "Opening - Bombing Mission",
  },
  "12 Time of the Season.m4a": {
    artist: "The Zombies",
    song: "Time of the Season",
  },
  "Canopée.mp3": { artist: "Polo & Pan", song: "Canopée" },
  "Dimond Saints  Howler.mp3": { artist: "Dimond Saints", song: "Howler" },
  "Dream Police.mp3": { artist: "Cheap Trick", song: "Dream Police" },
  "Errantry by J R R Tolkien.mp3": {
    artist: "J.R.R. Tolkien",
    song: "Errantry",
  },
  "Lord Of The Rings - The Shire (Cinematic Trap Remix) [ ezmp3.cc ].mp3": {
    artist: "Cinematic Trap",
    song: "The Shire",
  },
  "OODINI - Like That.mp3": { artist: "OODINI", song: "Like That" },
  "Ott. - Skylon - 02 The Queen Of All Everything.mp3": {
    artist: "Ott",
    song: "The Queen Of All Everything",
  },
  "Penumbra.mp3": { artist: "Ovoid", song: "Penumbra" },
  "Theophany - Time's End II- Majora's Mask Remixed - 05 Woods of Mystery.mp3":
    { artist: "Theophany", song: "Woods of Mystery" },
  "Ween - Mutiliated Lips.mp3": { artist: "Ween", song: "Mutilated Lips" },
  "Ween - The Mollusk.mp3": { artist: "Ween", song: "The Mollusk" },
  "X-Men  The Animated Series intro (1992).mp3": {
    artist: "Ron Wasserman",
    song: "X-Men: The Animated Series Intro",
  },
  "bent-kiasmos.mp3": { artist: "Kiasmos", song: "Bent" },
  "cloudkicker-explorebecurious.mp3": {
    artist: "Cloudkicker",
    song: "Explore, Be Curious",
  },
  "concerning-hobbits.mp3": {
    artist: "Howard Shore",
    song: "Concerning Hobbits",
  },
  "cosmos.mp3": { artist: "Carl Sagan", song: "Cosmos" },
  "crossing-mars.mp3": {
    artist: "Harry Gregson-Williams",
    song: "Crossing Mars",
  },
  "hiatus-nightjar.mp3": { artist: "Hiatus", song: "Nightjar" },
  "light-dr-toast.mp3": { artist: "Dr. Toast", song: "Light" },
  "looped-kiasmos.mp3": { artist: "Kiasmos", song: "Looped" },
  "nau-bickram-ghosh.mp3": { artist: "Bickram Ghosh", song: "Nau" },
  "no-skin.mp3": { artist: "Mild Minds", song: "No Skin" },
  "ratatat-tacobelcanon.mp3": { artist: "Ratatat", song: "Tacobel Canon" },
  "so-down.mp3": { artist: "So Down", song: "Phantom" },
  "the-blue-whale.mp3": { artist: "Steven Price", song: "The Blue Whale" },
  "the-king-beetle-on-a-coconut-estate.mp3": {
    artist: "mewithoutYou",
    song: "The King Beetle on a Coconut Estate",
  },
  "the-queen-of-all-everything.mp3": {
    artist: "Ott",
    song: "The Queen Of All Everything",
  },
  "to-live-is-to-die-pulling-teeth.mp3": {
    artist: "Metallica",
    song: "To Live Is To Die / Pulling Teeth",
  },
  "together-syence-nicole-kidman.mp3": { artist: "Syence", song: "Together" },
  "tycho-a-walk.mp3": { artist: "Tycho", song: "A Walk" },
  "vanille-fraise.mp3": { artist: "L'Impératrice", song: "Vanille Fraise" },
  "zhu-only.mp3": { artist: "ZHU", song: "Only" },
};

// Experience filename format: <user>-<experienceName>.json
const extractPartsFromExperienceFilename = (
  filename: string,
): { user: string; experienceName: string } => {
  const parts = filename.split("-");
  return {
    user: parts[0],
    experienceName: parts.length < 2 ? "untitled" : parts.slice(1).join("-"),
  };
};

const getExperiences = async () => {
  const s3 = getS3();
  const listObjectsCommand = new ListObjectsCommand({
    Bucket: ASSET_BUCKET_NAME,
    Prefix: EXPERIENCE_ASSET_PREFIX,
  });
  const data = await s3.send(listObjectsCommand);

  const experiences = [];
  for (const object of data.Contents ?? []) {
    const filename = object.Key?.split("/")[1] ?? "";
    console.log("fetching experience", filename);
    const getObjectCommand = new GetObjectCommand({
      Bucket: ASSET_BUCKET_NAME,
      Key: `${EXPERIENCE_ASSET_PREFIX}${filename}`,
    });
    const data = await s3.send(getObjectCommand);
    const experienceString = await data.Body?.transformToString();
    if (experienceString) {
      const experience = JSON.parse(experienceString);
      experience.name = filename.split(".").slice(0, -1).join(".");
      experiences.push(experience);
    }
  }
  return experiences;
};

// this is all extremely quick and dirty AVERT YOUR EYES
const migration = async () => {
  const experiences = await getExperiences();

  const users: string[] = Array.from(
    new Set(experiences.map((experience) => experience.user)),
  );
  const songs: string[] = Array.from(
    new Set(
      experiences.map((experience) => experience.audioStore.selectedAudioFile),
    ),
  );
  for (const song of songs) {
    if (!songMap[song]) {
      console.log("missing song mapping", song);
      return;
    }
  }

  const localDB = getLocalDatabase();

  console.log("creating users and songs");
  const dbUsers: Record<string, any> = {};
  for (const user of users) {
    const [dbUser] = await localDB
      .insert(schema.users)
      .values({ username: user, isAdmin: user === "ben" })
      .returning()
      .execute();
    console.log("created user", dbUser);
    dbUsers[user] = dbUser;
  }

  const dbSongs: Record<string, any> = {};
  for (const song of songs) {
    const { artist, song: songName } = songMap[song];
    const [dbSong] = await localDB
      .insert(schema.songs)
      .values([{ artist, name: songName, filename: song }])
      .returning()
      .execute();
    console.log("created song", dbSong);
    dbSongs[song] = dbSong;
  }

  for (const experience of experiences) {
    const user = dbUsers[experience.user];
    const song = dbSongs[experience.audioStore.selectedAudioFile];
    const data = { layers: experience.layers };
    const { experienceName: truncatedName } =
      extractPartsFromExperienceFilename(experience.name);
    await localDB
      .insert(schema.experiences)
      .values([
        {
          name: truncatedName === "untitled" ? experience.name : truncatedName,
          songId: song.id,
          version: 1,
          userId: user.id,
          data,
        },
      ])
      .execute();
    console.log("created experience", experience.name);
  }
};

migration();
