import { GetObjectCommand, ListObjectsCommand } from "@aws-sdk/client-s3";
import {
  ASSET_BUCKET_NAME,
  EXPERIENCE_ASSET_PREFIX,
  getS3,
} from "@/src/utils/assets";
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
  Spinner,
  Text,
} from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { useEffect, useState } from "react";

export const OpenExperienceModal = observer(function OpenExperienceModal() {
  const store = useStore();
  const { experienceStore, uiStore } = store;

  const [loading, setLoading] = useState(true);
  const [experiences, setExperiences] = useState<string[]>([]);

  useEffect(() => {
    if (!uiStore.openExperienceModalShowing || !store.user) return;

    setLoading(true);

    // get list of objects from s3 bucket using aws sdk
    const listObjectsCommand = new ListObjectsCommand({
      Bucket: ASSET_BUCKET_NAME,
      Prefix: EXPERIENCE_ASSET_PREFIX,
    });
    getS3()
      .send(listObjectsCommand)
      .then((data) => {
        const experienceFiles =
          // get the names of all experience files
          data.Contents?.map((object) => object.Key?.split("/")[1] ?? "")
            // filter down to only this user's experiences
            .filter((e) => e.startsWith(store.user))
            // remove .json extension
            .map((e) => e.replaceAll(".json", "")) ?? [];
        setExperiences(experienceFiles);
        setLoading(false);
      });
  }, [uiStore.openExperienceModalShowing, store.user]);

  const onClose = () => {
    uiStore.openExperienceModalShowing = false;
  };
  const onOpenExperience = async (experience: string) => {
    // get object from s3 bucket using aws sdk
    const getObjectCommand = new GetObjectCommand({
      Bucket: ASSET_BUCKET_NAME,
      Key: `${EXPERIENCE_ASSET_PREFIX}${experience}.json`,
    });
    const experienceData = await getS3().send(getObjectCommand);
    const experienceString = await experienceData.Body?.transformToString();
    if (experienceString) experienceStore.loadFromString(experienceString);

    onClose();
  };
  return (
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
          {store.user ? (
            loading ? (
              <Spinner />
            ) : (
              <>
                <Text>
                  Viewing {store.user}&apos;s experiences. Click to open.
                </Text>
                {experiences.map((experience) => (
                  <Button
                    key={experience}
                    variant="ghost"
                    onClick={() => onOpenExperience(experience)}
                  >
                    {experience}
                  </Button>
                ))}
                {experiences.length === 0 && (
                  <Text color="gray.400">(no saved experiences yet)</Text>
                )}
              </>
            )
          ) : (
            <Text>Please log in first!</Text>
          )}
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
});
