const TikTokScraper = require("tiktok-scraper");
const ffmpeg = require("fluent-ffmpeg");
const speech = require("@google-cloud/speech");
const fs = require("fs");
const ytdl = require("youtube-dl-exec");

const client = new speech.SpeechClient({
  keyFilename: "path-to-your-google-cloud-key.json", // Thay đổi đường dẫn đến khóa của bạn
});

async function downloadVideo(url) {
  const output = `videos/video.mp4`;
  try {
    await ytdl(url, {
      output,
      // Additional youtube-dl options can be set here
    });
    console.log(`Downloaded video saved to ${output}`);
    return output;
  } catch (error) {
    console.error("Failed to download video:", error);
  }
}

function extractAudio(videoPath, audioPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .output(audioPath)
      .audioCodec("pcm_s16le")
      .audioChannels(1)
      .on("end", () => resolve(audioPath))
      .on("error", reject)
      .run();
  });
}

async function transcribeAudio(audioPath) {
  const file = fs.readFileSync(audioPath);
  const audioBytes = file.toString("base64");

  const request = {
    audio: { content: audioBytes },
    config: {
      encoding: "LINEAR16",
      sampleRateHertz: 16000,
      languageCode: "en-US",
    },
  };

  const [response] = await client.recognize(request);
  const transcription = response.results
    .map((result) => result.alternatives[0].transcript)
    .join("\n");
  return transcription;
}

(async () => {
  const url =
    "https://www.tiktok.com/@suckhoelavang.666/video/7406710200494755080";
  const videoPath = await downloadVideo(url);
  const audioPath = "tempAudio.flac";
  await extractAudio(videoPath, audioPath);
  const transcript = await transcribeAudio(audioPath);
  console.log(transcript);
})();
