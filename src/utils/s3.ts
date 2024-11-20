import { ASSET_BUCKET_REGION } from "../utils/assets";
import { S3Client } from "@aws-sdk/client-s3";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";

let _s3: S3Client | null = null;
export const getS3 = () => {
  if (_s3) return _s3;

  return (_s3 = new S3Client({
    credentials: fromCognitoIdentityPool({
      clientConfig: { region: "us-west-1" },
      identityPoolId: "us-west-1:a7b986e6-596e-4498-9637-eccd8864e5fa",
    }),
    region: ASSET_BUCKET_REGION,
  }));
};
