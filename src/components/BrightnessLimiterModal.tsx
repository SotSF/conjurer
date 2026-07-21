import { observer } from "mobx-react-lite";
import {
  FormControl,
  FormHelperText,
  FormLabel,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Switch,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useStore } from "@/src/types/StoreContext";
import { action } from "mobx";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export const BrightnessLimiterModal = observer(function BrightnessLimiterModal({
  isOpen,
  onClose,
}: Props) {
  const store = useStore();

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Brightness limiter</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack align="stretch" spacing={5}>
            <Text fontSize="sm" color="gray.300">
              Like a DAW limiter on the canopy output: when average LED
              brightness exceeds the threshold, gain is reduced instantly so the
              average sits at the threshold. When brightness falls back under,
              gain releases toward full over the release time. The GR meter
              shows how much gain is currently being pulled down.
            </Text>

            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="brightness-limiter-enabled" mb={0} flex="1">
                Enabled
              </FormLabel>
              <Switch
                id="brightness-limiter-enabled"
                isChecked={store.brightnessLimiterEnabled}
                onChange={action(
                  (e) =>
                    (store.brightnessLimiterEnabled = e.target.checked),
                )}
              />
            </FormControl>

            <FormControl isDisabled={!store.brightnessLimiterEnabled}>
              <FormLabel>
                Threshold{" "}
                {(store.brightnessLimiterThreshold * 100).toFixed(0)}%
              </FormLabel>
              <Slider
                aria-label="Brightness limiter threshold"
                min={0.05}
                max={1}
                step={0.01}
                value={store.brightnessLimiterThreshold}
                onChange={action(
                  (v) => (store.brightnessLimiterThreshold = v),
                )}
                colorScheme="orange"
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
              <FormHelperText>
                Target average canopy luminance. Lower = more aggressive
                limiting.
              </FormHelperText>
            </FormControl>

            <FormControl isDisabled={!store.brightnessLimiterEnabled}>
              <FormLabel>
                Release {store.brightnessLimiterReleaseSec.toFixed(1)}s
              </FormLabel>
              <Slider
                aria-label="Brightness limiter release"
                min={0.1}
                max={5}
                step={0.1}
                value={store.brightnessLimiterReleaseSec}
                onChange={action(
                  (v) => (store.brightnessLimiterReleaseSec = v),
                )}
                colorScheme="orange"
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
              <FormHelperText>
                How long gain takes to return to full after brightness drops.
                Attack is always instant.
              </FormHelperText>
            </FormControl>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
});
