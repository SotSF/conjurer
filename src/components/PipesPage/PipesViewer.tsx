import styles from "@/styles/PipesViewer.module.css";
import { Box, Button, VStack } from "@chakra-ui/react";
import { PreviewCanvas } from "@/src/components/Canvas/PreviewCanvas";
import { ReactNode, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";
import { CircleOfPipe } from "@/src/patterns/CircleOfPipe";
import { Block } from "@/src/types/Block";
import Image from "next/image";
import gsap from "gsap";

const PATTERN_PREVIEW_DISPLAY_SIZE = 1200;

const FadeText = ({ children }: { children: ReactNode }) => (
  <p className={styles.fadeInRise}>{children}</p>
);

export const PipesViewer = observer(function PipesViewer() {
  const store = useStore();

  const pipesBlock = useMemo(() => new Block(store, CircleOfPipe()), [store]);

  const [currentStep, setCurrentStep] = useState(0);
  const steps: { content: ReactNode; onTransition?: () => void }[] = [
    { content: <FadeText>Hi Kevin</FadeText> },
    {
      onTransition: () => {
        gsap.to(pipesBlock.pattern.params.u_camera_distance, {
          value: 20,
          duration: 1,
        });
      },
      content: <FadeText>bye Kevin</FadeText>,
    },
  ];

  const onNextStep = () => {
    setCurrentStep(currentStep + 1);
    steps[currentStep + 1].onTransition?.();
  };

  return (
    <VStack
      position="relative"
      justify="end"
      width="100vw"
      height="100%"
      bgColor="black"
    >
      <VStack justify="center" alignItems="center" overflowX="hidden">
        <Box
          position="relative"
          width={`${PATTERN_PREVIEW_DISPLAY_SIZE}px`}
          height={`${PATTERN_PREVIEW_DISPLAY_SIZE}px`}
        >
          <VStack
            position="absolute"
            top={0}
            left={0}
            width="100%"
            height="100%"
            zIndex={1}
          >
            {steps[currentStep].content}
            {currentStep < steps.length - 1 && (
              <Button
                variant="unstyled"
                onClick={onNextStep}
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
            )}
          </VStack>
          <PreviewCanvas block={pipesBlock} />
        </Box>
      </VStack>
    </VStack>
  );
});
