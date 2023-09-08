import { observer } from "mobx-react-lite";
import {
  Box,
  Button,
  IconButton,
  Kbd,
  ListItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  OrderedList,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { useState } from "react";
import { RiPlayList2Fill } from "react-icons/ri";

export const ViewerInstructionsModal = observer(
  function ViewerInstructionsModal() {
    const store = useStore();
    const { uiStore } = store;

    const [currentStep, setCurrentStep] = useState(0);

    const onClose = action(
      () => (uiStore.showingViewerInstructionsModal = false)
    );

    const steps = [
      <Text key={0} lineHeight={2}>
        Legends tell of the{" "}
        <Button as="a" variant="link" href="https://se.cretfi.re/">
          Servants of the Secret Fire
        </Button>{" "}
        attending Burning Man in the year 2023.
      </Text>,
      <Text key={1} lineHeight={2}>
        These same legends suggest that a singularly powerful event was held by
        this camp - indeed, so powerful that the gods were greatly angered. In
        their jealous rage, they unleashed vast quantities of water, wind, and
        mud upon the playa, seeking to disrupt the powerful acts of conjury that
        were being performed.
      </Text>,
      <Text key={2} lineHeight={2}>
        But they acted too late.
      </Text>,
      <Text key={3} lineHeight={2}>
        As the first raindrops fell, some lucky few inhabitants of Black Rock
        City were actively being transformed by powerful magicks in the form of
        ten audiovisual experiences.
      </Text>,
      <Text key={4} lineHeight={2}>
        The Servants of the Secret Fire have provided this portal in time and
        space to give you with this same opportunity.
      </Text>,
      <>
        <Text key={5} textAlign="left">
          To properly experience for yourself what so angered the gods that day,
          the following is recommended:
        </Text>
        <OrderedList key={7} textAlign="left">
          <ListItem>
            Use a desktop computer or computer with a decent graphics card
          </ListItem>
          <ListItem>
            Use speakers or headphones and crank up the volume
          </ListItem>
          <ListItem>
            If any particular song&apos;s transformative power is channeling
            incorrectly (i.e. you don&apos;t like it) use the playlist button (
            <IconButton
              aria-label="Show playlist"
              title="Show playlist"
              height={6}
              icon={<RiPlayList2Fill size={17} />}
            />
            ) to navigate to a different track.
          </ListItem>
        </OrderedList>
      </>,
      <>
        <Text key={8} width="100%" textAlign="left">
          Afterwards, remember to:
        </Text>
        <OrderedList textAlign="left">
          <ListItem>
            Rechannel your own creative energies into the world
          </ListItem>
          <ListItem>Be excellent to each other</ListItem>
        </OrderedList>
      </>,
      <Text key={9} lineHeight={2}>
        It is time. Press <Kbd>space</Kbd> to begin.
      </Text>,
    ];

    return (
      <Modal
        onClose={onClose}
        isOpen={uiStore.showingViewerInstructionsModal}
        isCentered
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Welcome, wandering wizard</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack mx={3} height={80} textAlign="center" justify="center">
              {steps[currentStep]}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button mr={3} onClick={() => setCurrentStep(currentStep - 1)}>
              Previous
            </Button>
            <Button onClick={() => setCurrentStep(currentStep + 1)}>
              Next
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }
);
