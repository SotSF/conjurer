import { S3Client } from "@aws-sdk/client-s3";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";

export const ASSET_BUCKET_NAME = "brollin-assets";
export const ASSET_BUCKET_REGION = "us-west-1";
export const AUDIO_ASSET_PREFIX = "conjurer-audio/";
export const EXPERIENCE_ASSET_PREFIX = "conjurer-experiences/";
export const BEAT_MAP_ASSET_PREFIX = "conjurer-beat-maps/";

export const LOCAL_ASSET_DIRECTORY = "cloud-assets/";
export const LOCAL_ASSET_PATH = `./public/${LOCAL_ASSET_DIRECTORY}`;

let _s3: S3Client | null = null;
export const getS3 = () => {
  if (_s3) return _s3;

  return (_s3 = new S3Client({
    credentials: fromCognitoIdentityPool({
      clientConfig: { region: "us-east-2" },
      identityPoolId: "us-east-2:343f9a70-6bf5-40f3-b21d-1376f65bb4be",
    }),
    region: ASSET_BUCKET_REGION,
  }));
};
