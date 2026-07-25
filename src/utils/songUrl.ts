import {
  ASSET_BUCKET_NAME,
  ASSET_BUCKET_REGION,
  AUDIO_ASSET_PREFIX,
  LOCAL_ASSET_DIRECTORY,
} from "@/src/utils/assets";
import type { Song } from "@/src/types/Song";

export function getSongUrl(song: Song, usingLocalData: boolean) {
  if (!song.filename) return undefined;
  return usingLocalData
    ? `${location.origin}/${LOCAL_ASSET_DIRECTORY}${AUDIO_ASSET_PREFIX}${song.filename}`
    : `https://${ASSET_BUCKET_NAME}.s3.${ASSET_BUCKET_REGION}.amazonaws.com/${AUDIO_ASSET_PREFIX}${song.filename}`;
}
