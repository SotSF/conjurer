import { ListObjectsCommand, S3Client } from "@aws-sdk/client-s3";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";
import {
  ASSET_BUCKET_NAME,
  ASSET_BUCKET_REGION,
  EXPERIENCE_ASSET_PREFIX,
} from "@/src/utils/audio";
import { observer } from "mobx-react-lite";
import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { useEffect, useState } from "react";

export const OpenExperienceModal = observer(function OpenExperienceModal() {
  const store = useStore();
  const { experienceStore, uiStore } = store;

  const [experiences, setExperiences] = useState<string[]>([]);

  useEffect(() => {
    if (!uiStore.openExperienceModalShowing) return;

    // get list of objects from s3 bucket using aws sdk
    const s3 = new S3Client({
      credentials: fromCognitoIdentityPool({
        clientConfig: { region: "us-east-2" },
        identityPoolId: "us-east-2:343f9a70-6bf5-40f3-b21d-1376f65bb4be",
      }),
      region: ASSET_BUCKET_REGION,
    });
    const listObjectsCommand = new ListObjectsCommand({
      Bucket: ASSET_BUCKET_NAME,
      Prefix: EXPERIENCE_ASSET_PREFIX,
    });
    s3.send(listObjectsCommand).then((data) => {
      console.log(data);
      const experienceFiles =
        data.Contents?.map((object) => object.Key?.split("/")[1] ?? "").filter(
          (e) => !!e
        ) ?? [];
      setExperiences(experienceFiles);
    });
  }, [uiStore.openExperienceModalShowing]);

  const onOpenExperience = () => {};
  const onClose = () => {
    uiStore.openExperienceModalShowing = false;
  };
  return (
    <>
      <Modal
        onClose={onClose}
        isOpen={uiStore.openExperienceModalShowing}
        isCentered
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Open experience</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Viewing {store.user || "anonymous"}&apos;s experiences:</Text>
            {experiences.map((experience) => (
              <Button variant="ghost" key={experience}>
                {experience}
              </Button>
            ))}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onOpenExperience}>Open</Button>
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
});
