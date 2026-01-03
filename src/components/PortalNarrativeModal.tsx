import styles from "@/styles/ViewerInstructionsModal.module.css";
import { observer } from "mobx-react-lite";
import {
  Button,
  Grid,
  GridItem,
  IconButton,
  Kbd,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";
import { useEffect, useRef, useState } from "react";
import { RiSkipRightFill } from "react-icons/ri";
import Image from "next/image";
import { Rain } from "@/src/components/Rain";
import { FiMonitor } from "react-icons/fi";
import { FaHeadphonesAlt } from "react-icons/fa";

const PortalNarrativeModal = observer(function PortalNarrativeModal() {
  const store = useStore();
  const { uiStore } = store;

  const nextButtonRef = useRef(null);
  const [currentStep, setCurrentStep] = useState(0);

  const onClose = action(() => (uiStore.showingPortalNarrativeModal = false));
  useEffect(() => {
    const handleKeyDown = action((e: KeyboardEvent) => {
      if (e.key === " ") onClose();
    });
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [store, uiStore, onClose]);

  const steps = [
    <Text key={0} lineHeight={2}>
      Legend tells of a group of wizards,
      <br />
      <strong>The Servants of the Secret Fire</strong>,
      <br />
      who attended Burning Man in 2023.
      <br />
      (click the icon below to continue)
    </Text>,
    <Text key={1} lineHeight={2}>
      This legend suggests that these wizards performed a singularly powerful
      act - indeed, so powerful that the gods took notice and became{" "}
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
    <>
      <Rain mouseObject="Umbrella" />
      <Text key={1} lineHeight={2}>
        In their jealous rage, the gods unleashed{" "}
        <strong>vast quantities of water, wind, and mud</strong> upon the playa,
        seeking to disrupt the wizards&apos; powerful acts of conjury.
      </Text>
    </>,
    <Text key={2} lineHeight={2}>
      But they acted too late!
    </Text>,
    <>
      <Rain auto />
      <Text key={3} lineHeight={2}>
        As the first raindrops fell, some lucky few inhabitants of Black Rock
        City were already witnessing powerful magicks in the form of ten
        audiovisual{" "}
        <Button
          as="a"
          variant="link"
          href="https://se.cretfi.re/canopy"
          target="_blank"
        >
          Canopy
        </Button>{" "}
        experiences.
      </Text>
    </>,
    <Text key={4} lineHeight={2}>
      The Servants of the Secret Fire have provided this portal in time and
      space so that you may experience yourself the audiovisual Canopy
      experiences that so angered the gods that day.
    </Text>,
    <>
      <Text key={5} width="100%" textAlign="left">
        Recommendations:
      </Text>
      <Grid
        gridTemplateColumns="auto 1fr"
        gap={2}
        textAlign="left"
        fontSize="lg"
      >
        <GridItem pt={0.5}>
          <FiMonitor size={17} />
        </GridItem>
        <GridItem>
          <Text>
            Use a <strong>desktop computer</strong>
          </Text>
        </GridItem>
        <GridItem pt={0.5}>
          <FaHeadphonesAlt size={17} />
        </GridItem>
        <GridItem>
          <Text>
            Use <strong>speakers</strong>/<strong>headphones</strong>
          </Text>
        </GridItem>
        <GridItem pt={0.5}>
          <RiSkipRightFill size={17} />
        </GridItem>
        <GridItem>
          Go to the <strong>next song</strong> with&nbsp;
          <IconButton
            aria-label="Next song"
            title="Next song"
            height={6}
            icon={<RiSkipRightFill size={17} />}
          />
        </GridItem>
      </Grid>
    </>,
    <>
      <Text key={9} lineHeight={2}>
        It is time.
      </Text>
      <Text key={10} lineHeight={2}>
        Press <Kbd>space</Kbd> or click below to begin.
      </Text>
    </>,
  ];

  const incrementStep = () => {
    if (currentStep >= steps.length - 1) {
      store.togglePlaying();
      onClose();
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  return (
    <Modal
      onClose={onClose}
      isOpen={uiStore.showingPortalNarrativeModal}
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
              fontSize="xl"
              textAlign="center"
              justify="center"
              overflow="clip"
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
});

export default PortalNarrativeModal;
