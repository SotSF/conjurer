import styles from "@/styles/PipesViewer.module.css";
import { Box, Button, HStack, Text, VStack } from "@chakra-ui/react";
import { PreviewCanvas } from "@/src/components/Canvas/PreviewCanvas";
import { ReactNode, memo, useMemo, useState } from "react";
import { useStore } from "@/src/types/StoreContext";
import { CircleOfPipe } from "@/src/patterns/CircleOfPipe";
import { Block } from "@/src/types/Block";
import Image from "next/image";
import gsap from "gsap";
import { ParameterControls } from "@/src/components/PatternPlayground/ParameterControls";

const PATTERN_PREVIEW_DISPLAY_SIZE = 1200;

const FadeText = ({ children }: { children: ReactNode }) => (
  <Text
    userSelect="none"
    fontSize="2xl"
    className={styles.fadeInRise}
    bgColor="rgba(100,100,100,0.5)"
    p={2}
    borderRadius="xl"
  >
    {children}
  </Text>
);

export const PipesViewer = memo(function PipesViewer() {
  const store = useStore();

  const pipesBlock = useMemo(() => {
    const block = new Block(store, CircleOfPipe());
    block.pattern.params.u_repeat_count.value = 1;
    block.pattern.params.u_rust_threshold.value = -10;
    block.pattern.params.u_cutoff_threshold.value = -20;
    return block;
  }, [store]);

  const [currentStep, setCurrentStep] = useState(0);
  const [nextStepReady, setNextStepReady] = useState(true);
  const steps: { content: ReactNode; onTransition?: () => void }[] = [
    { content: <FadeText>Hi Kevin</FadeText> },
    {
      onTransition: () => {
        gsap.to(pipesBlock.pattern.params.u_repeat_count, {
          keyframes: [
            {
              delay: 0.5,
              onComplete: () => {
                pipesBlock.pattern.params.u_repeat_count.value = 3;
              },
            },
            {
              delay: 0.5,
              onComplete: () => {
                pipesBlock.pattern.params.u_repeat_count.value = 5;
                setNextStepReady(true);
              },
            },
          ],
        });
      },
      content: (
        <FadeText>
          For this lap around the sun, I made you these procedurally generated
          pipes.
        </FadeText>
      ),
    },
    {
      onTransition: () => {
        gsap.to(pipesBlock.pattern.params.u_camera_distance, {
          value: 20,
          duration: 1,
          onComplete: () => {
            setNextStepReady(true);
          },
        });
      },
      content: (
        <FadeText>
          However, everything gets older and these pipes are no exception.
        </FadeText>
      ),
    },
    {
      onTransition: () => {
        gsap.to(pipesBlock.pattern.params.u_camera_distance, {
          value: 7,
          duration: 1,
        });
        gsap.to(pipesBlock.pattern.params.u_camera_y, {
          value: -10,
          duration: 1,
          onComplete: () => {
            setNextStepReady(true);
          },
        });
      },
      content: (
        <>
          <FadeText>
            Just look: where once they were new and shiny, now they are old and
            decrepit.
          </FadeText>
          <FadeText>Sound familiar?</FadeText>
        </>
      ),
    },
    {
      onTransition: () => setNextStepReady(true),
      content: (
        <FadeText>
          No matter. Where there is a will there is a way. Click to regenerate
          pipes!
        </FadeText>
      ),
    },
    {
      onTransition: () => {
        gsap.to(pipesBlock.pattern.params.u_rust_threshold, {
          value: 0,
          duration: 1,
        });
        gsap.to(pipesBlock.pattern.params.u_cutoff_threshold, {
          keyframes: [
            {
              value: 2,
              duration: 5,
              onComplete: () => {
                pipesBlock.pattern.params.u_cutoff_threshold.value = -20;
                pipesBlock.pattern.params.u_rust_threshold.value = -30;
                pipesBlock.pattern.params.u_camera_distance.value = 10;
                pipesBlock.pattern.params.u_camera_y.value = 15;
                pipesBlock.pattern.params.u_repeat_count.value = 7;
              },
            },
          ],
        });
        gsap.to(pipesBlock.pattern.params.u_camera_y, {
          value: 0,
          delay: 5.01,
          duration: 5,
          onComplete: () => setNextStepReady(true),
        });
      },
      content: <></>,
    },
    {
      onTransition: () => setNextStepReady(true),
      content: (
        <FadeText>
          So maybe this is a reminder to procedurally regenerate the old pipes
          of your life or something.
        </FadeText>
      ),
    },
    {
      onTransition: () => setNextStepReady(true),
      content: <FadeText>It&apos;s the circleeee of pipe!</FadeText>,
    },
    {
      content: (
        <>
          <FadeText>Happy birthday!</FadeText>
          <FadeText>- Ben</FadeText>
        </>
      ),
    },
  ];

  const onNextStep = () => {
    setNextStepReady(false);
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
      <HStack justify="center" alignItems="center">
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
            {currentStep < steps.length - 1 && nextStepReady && (
              <Button
                mt={2}
                className={styles.fadeInRise}
                variant="unstyled"
                onClick={onNextStep}
                _hover={{ boxShadow: "xl", transform: "scale(1.1)" }}
                width="60px"
                height="84px"
                borderRadius="50%"
                textAlign="center"
              >
                <Image
                  priority
                  src="/secret-fire-logo.svg"
                  alt="Secret Fire logo"
                  width={60}
                  height={80}
                  style={{ width: "60px", height: "80px" }}
                />
              </Button>
            )}
          </VStack>
          {currentStep > 0 && (
            <Box
              className={styles.fadeInRise}
              position="absolute"
              top={0}
              left={0}
              width="100%"
              height="100%"
            >
              <PreviewCanvas frameloop="always" block={pipesBlock} />
            </Box>
          )}
        </Box>
        {currentStep === steps.length - 1 && (
          <Box width="400px">
            <ParameterControls block={pipesBlock} />
          </Box>
        )}
      </HStack>
    </VStack>
  );
});
