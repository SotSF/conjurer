import { ASSET_BUCKET_REGION } from "@/src/utils/assets";
import { S3Client } from "@aws-sdk/client-s3";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";

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
