import { GetObjectCommand, ListObjectsCommand } from "@aws-sdk/client-s3";
import {
  ASSET_BUCKET_NAME,
  EXPERIENCE_ASSET_PREFIX,
  getS3,
} from "@/src/utils/assets";
import { observer } from "mobx-react-lite";
import {
  Button,
  HStack,
  Input,
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

export const SaveExperienceModal = observer(function SaveExperienceModal() {
  const store = useStore();
  const { experienceStore, uiStore } = store;

  const [loading, setLoading] = useState(true);
  const [experiences, setExperiences] = useState<string[]>([]);

  useEffect(() => {
    if (!uiStore.showingSaveExperienceModal || !store.user) return;

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
  }, [uiStore.showingSaveExperienceModal, store.user]);

  const onClose = () => {
    uiStore.showingSaveExperienceModal = false;
  };
  const onSaveExperience = async () => {
    // TODO: save experience
    // onClose();
  };
  return (
    <Modal
      onClose={onClose}
      isOpen={uiStore.showingSaveExperienceModal}
      isCentered
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Save experience as...</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {store.user ? (
            loading ? (
              <Spinner />
            ) : (
              <>
                <HStack mb={4} spacing={0}>
                  <Text>{store.user}-</Text>
                  <Input></Input>
                </HStack>
                {experiences.length === 0 ? (
                  <Text color="gray.400">
                    {store.user} has no saved experiences yet!
                  </Text>
                ) : (
                  <Text>Careful not to overwrite an existing experience:</Text>
                )}
                {experiences.map((experience) => (
                  <Text key={experience} fontWeight="bold">
                    {experience}
                  </Text>
                ))}
              </>
            )
          ) : (
            <Text>Please log in first!</Text>
          )}
        </ModalBody>
        <ModalFooter>
          <Button onClick={() => onSaveExperience()}>Save</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
});
