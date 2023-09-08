import styles from "@/styles/ViewerInstructionsModal.module.css";
import { observer } from "mobx-react-lite";
import {
  Button,
  IconButton,
  Kbd,
  ListItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  OrderedList,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { useRef, useState } from "react";
import { RiPlayList2Fill } from "react-icons/ri";
import Image from "next/image";

export const ViewerInstructionsModal = observer(
  function ViewerInstructionsModal() {
    const store = useStore();
    const { uiStore } = store;

    const nextButtonRef = useRef(null);
    const [currentStep, setCurrentStep] = useState(0);

    const onClose = action(
      () => (uiStore.showingViewerInstructionsModal = false)
    );

    const steps = [
      <Text key={0} lineHeight={2}>
        Legends tell of the{" "}
        <Button
          as="a"
          variant="link"
          href="https://se.cretfi.re/"
          target="_blank"
        >
          Servants of the Secret Fire
        </Button>{" "}
        attending Burning Man in the year 2023.
      </Text>,
      <Text key={1} lineHeight={2}>
        These same legends suggest that a singularly powerful event was held by
        this camp - indeed, so powerful that the gods were{" "}
        <Text
          as="span"
          position="absolute"
          color="red"
          className={styles.vibrate}
        >
          greatly angered
        </Text>
        <Text as="span" opacity={0}>
          greatly angered
        </Text>
        .
      </Text>,
      <Text key={1} lineHeight={2}>
        In their jealous rage, they unleashed vast quantities of water, wind,
        and mud upon the playa, seeking to disrupt the powerful acts of conjury
        that were being performed.
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
        space to prove the legends true and to give you this same opportunity.
      </Text>,
      <>
        <Text key={5}>
          To properly experience for yourself what so angered the gods that day,
          the following is recommended:
        </Text>
        <OrderedList key={7} fontSize="sm" textAlign="left">
          <ListItem>
            Use a <strong>desktop computer</strong> or computer with a decent
            graphics card
          </ListItem>
          <ListItem>
            Use <strong>speakers</strong> or <strong>headphones</strong> and
            crank up the volume
          </ListItem>
          <ListItem>
            If any particular song&apos;s transformative power is channeling
            incorrectly (i.e. you don&apos;t like it) use the{" "}
            <strong>playlist button</strong>:
            <IconButton
              aria-label="Show playlist"
              title="Show playlist"
              height={6}
              icon={<RiPlayList2Fill size={17} />}
            />{" "}
            to navigate to a different track
          </ListItem>
        </OrderedList>
      </>,
      <>
        <Text key={8} width="100%" textAlign="left">
          Afterwards, remember to:
        </Text>
        <OrderedList fontSize="sm" textAlign="left">
          <ListItem>
            Rechannel your own creative energies into the world
          </ListItem>
          <ListItem>Be excellent to each other</ListItem>
        </OrderedList>
      </>,
      <>
        <Text key={9} lineHeight={2}>
          It is time.
        </Text>
        <Text key={10} lineHeight={2}>
          Press <Kbd>space</Kbd> to begin.
        </Text>
      </>,
    ];

    const incrementStep = () => {
      if (currentStep >= steps.length - 1) {
        onClose();
        return;
      }
      setCurrentStep(currentStep + 1);
    };

    return (
      <Modal
        onClose={onClose}
        isOpen={uiStore.showingViewerInstructionsModal}
        size="full"
        initialFocusRef={nextButtonRef}
        motionPreset="none"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody>
            <VStack width="100%" height="90vh" justify="center">
              <VStack
                key={currentStep}
                className={styles.fadeInRise}
                mx={3}
                width={80}
                height={80}
                textAlign="center"
                justify="center"
              >
                {steps[currentStep]}
              </VStack>
              <Button
                ref={nextButtonRef}
                variant="unstyled"
                onClick={incrementStep}
                _hover={{ boxShadow: "xl", transform: "scale(1.1)" }}
                width="60px"
                height="84px"
                borderRadius="50%"
                textAlign="center"
              >
                <Image
                  src="/secret-fire-logo.svg"
                  alt="Secret Fire logo"
                  width={60}
                  height={80}
                  style={{ width: "60px", height: "80px" }}
                />
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }
);
