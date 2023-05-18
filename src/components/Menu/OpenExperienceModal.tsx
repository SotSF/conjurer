import { GetObjectCommand } from "@aws-sdk/client-s3";
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
import { useExperiences } from "@/src/hooks/experiences";

export const OpenExperienceModal = observer(function OpenExperienceModal() {
  const store = useStore();
  const { experienceStore, uiStore } = store;

  const { loading, experiences } = useExperiences(
    uiStore.showingOpenExperienceModal
  );

  const onClose = () => {
    uiStore.showingOpenExperienceModal = false;
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
      isOpen={uiStore.showingOpenExperienceModal}
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
                {experiences.length === 0 && (
                  <Text color="gray.400">
                    {store.user} has no saved experiences yet!
                  </Text>
                )}
                {experiences.map((experience) => (
                  <Button
                    key={experience}
                    variant="ghost"
                    onClick={() => onOpenExperience(experience)}
                  >
                    {experience}
                  </Button>
                ))}
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
