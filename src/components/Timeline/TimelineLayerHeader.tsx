import { observer } from "mobx-react-lite";
import { useStore } from "@/src/types/StoreContext";
import {
  Box,
  Button,
  Editable,
  EditableInput,
  EditablePreview,
  HStack,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import { Layer } from "@/src/types/Layer";
import { action, runInAction } from "mobx";
import { useEffect } from "react";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import {
  MdDragIndicator,
  MdExpandMore,
  MdChevronRight,
  MdBlurOn,
} from "react-icons/md";
import { FaTrashAlt } from "react-icons/fa";
import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import { hoverHelpProps } from "@/src/utils/hoverHelp";
import { AddTrackEffectMenu } from "@/src/components/Timeline/AddTrackEffectMenu";

type Props = {
  index: number;
  layer: Layer;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
};

export const TimelineLayerHeader = observer(function TimelineLayerHeader({
  index,
  layer,
  dragHandleProps,
}: Props) {
  const store = useStore();
  const { selectedLayer, uiStore } = store;

  const bgColor = selectedLayer === layer ? "gray.300" : "gray.400";

  const canDelete = store.layers.length > 1;
  const canReorder = store.layers.length > 1;

  const displayName = layer.name || `Layer ${index + 1}`;
  const blockCount = layer.getAllBlocks().length;
  const collapsed = layer.collapsed;

  const { effectTrack } = layer;

  const confirmDelete = useDisclosure();

  // a just-created layer opens its name field in edit mode; consume the flag on
  // mount so it fires exactly once (only the new layer's header mounts fresh)
  const startNamingOnMount = store.uiStore.layerIdToNameOnMount === layer.id;
  useEffect(() => {
    if (startNamingOnMount)
      runInAction(() => (store.uiStore.layerIdToNameOnMount = null));
    // run once, on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <VStack
      position="sticky"
      left={0}
      width="150px"
      height="100%"
      flexShrink={0}
      spacing={0}
      zIndex={11}
      boxSizing="border-box"
      borderTopWidth={index === 0 ? 1 : 0}
      borderRightWidth={1}
      borderBottomWidth={1}
      borderColor="black"
      bgColor={bgColor}
    >
      {/* Stick below the 80px TimerAndWaveform so the label/controls stay
          visible while scrolling through a tall layer. */}
      <VStack
        position="sticky"
        top="80px"
        width="100%"
        px={1}
        py={1}
        spacing={0}
        bgColor={bgColor}
        zIndex={1}
      >
        {/* Row 1: drag · name · collapse */}
        <HStack width="100%" spacing={0} align="center" minH="22px">
          {canReorder ? (
            <Box
              {...dragHandleProps}
              flexShrink={0}
              cursor="grab"
              color="gray.500"
              _hover={{ color: "gray.700" }}
              display="flex"
              alignItems="center"
              justifyContent="center"
              w="18px"
              h="18px"
              aria-label="Drag to reorder layer"
              title="Drag to reorder layer"
              {...hoverHelpProps(
                uiStore,
                "Reorder layer",
                "Drag to change layer stacking order. Top layers render above lower ones.",
              )}
            >
              <MdDragIndicator size={14} />
            </Box>
          ) : (
            <Box flexShrink={0} w="18px" />
          )}

          <Editable
            flex={1}
            // collapsed: let this shrink below its content size (flex items
            // default to min-width:auto) so the name can clip to an ellipsis.
            // Expanded: leave it be, so a long name is free to wrap and overflow
            // into the row's vertical space.
            minW={collapsed ? 0 : undefined}
            overflow={collapsed ? "hidden" : undefined}
            {...hoverHelpProps(
              uiStore,
              "Layer name",
              "Click to rename this layer.",
            )}
            px={0.5}
            placeholder={`Layer ${index + 1}`}
            value={layer.name}
            startWithEditView={startNamingOnMount}
            onChange={action((value) => store.renameLayer(layer, value))}
            color="black"
            fontSize={13}
            fontWeight="bold"
            lineHeight="1.2"
            textAlign="center"
          >
            <EditablePreview
              display={collapsed ? "block" : undefined}
              width={collapsed ? "100%" : undefined}
              py={0}
              whiteSpace={collapsed ? "nowrap" : undefined}
              overflow={collapsed ? "hidden" : undefined}
              textOverflow={collapsed ? "ellipsis" : undefined}
              // only truncated when collapsed, so only then is a tooltip useful
              title={collapsed ? displayName : undefined}
            />
            <EditableInput
              py={0}
              height="20px"
              _placeholder={{ color: "gray.600" }}
            />
          </Editable>

          <IconButton
            flexShrink={0}
            minW="18px"
            w="18px"
            h="18px"
            variant="unstyled"
            color="gray.600"
            _hover={{ color: "gray.800" }}
            display="flex"
            alignItems="center"
            justifyContent="center"
            aria-label={layer.collapsed ? "Expand layer" : "Collapse layer"}
            title={layer.collapsed ? "Expand layer" : "Collapse layer"}
            icon={
              layer.collapsed ? (
                <MdChevronRight size={16} />
              ) : (
                <MdExpandMore size={16} />
              )
            }
            onClick={action((e) => {
              layer.collapsed = !layer.collapsed;
              e.stopPropagation();
            })}
            {...hoverHelpProps(
              uiStore,
              layer.collapsed ? "Expand layer" : "Collapse layer",
              "Hide or show this layer's blocks and automation lanes.",
            )}
          />
        </HStack>

        {/* Row 2: visibility · delete */}
        <HStack width="100%" spacing={1} justify="center" minH="20px">
          <IconButton
            minW="20px"
            w="20px"
            h="20px"
            variant="unstyled"
            color={layer.visible ? "gray.500" : "red.600"}
            display="flex"
            alignItems="center"
            justifyContent="center"
            aria-label="Toggle layer visibility"
            title="Toggle layer visibility"
            icon={
              layer.visible ? (
                <AiFillEye size={14} />
              ) : (
                <AiFillEyeInvisible size={14} />
              )
            }
            onClick={action((e) => {
              layer.visible = !layer.visible;
              e.stopPropagation();
            })}
            {...hoverHelpProps(
              uiStore,
              "Layer visibility",
              "Hide this layer from the render without deleting its blocks.",
            )}
          />

          {effectTrack && (
            <AddTrackEffectMenu
              track={effectTrack}
              helpTitle="Add layer effect"
              helpDescription="Append an effect applied to everything this layer renders, after its blocks are merged together."
            />
          )}

          {effectTrack && effectTrack.blocks.length > 0 && (
            <IconButton
              minW="20px"
              w="20px"
              h="20px"
              variant="unstyled"
              color={effectTrack.visible ? "blue.600" : "gray.500"}
              display="flex"
              alignItems="center"
              justifyContent="center"
              aria-label="Bypass layer effects"
              title="Bypass layer effects"
              icon={<MdBlurOn size={15} />}
              onClick={action((e) => {
                effectTrack.toggleVisible();
                e.stopPropagation();
              })}
              {...hoverHelpProps(
                uiStore,
                "Layer effect track",
                "Take this layer's effect track out of the signal path without deleting it.",
              )}
            />
          )}

          <IconButton
            minW="20px"
            w="20px"
            h="20px"
            variant="unstyled"
            color="gray.600"
            _hover={{ color: "red.500" }}
            display="flex"
            alignItems="center"
            justifyContent="center"
            aria-label="Delete layer"
            title={canDelete ? "Delete layer" : "Can't delete the only layer"}
            isDisabled={!canDelete}
            icon={<FaTrashAlt size={11} />}
            onClick={(e) => {
              e.stopPropagation();
              confirmDelete.onOpen();
            }}
            {...hoverHelpProps(
              uiStore,
              "Delete layer",
              canDelete
                ? "Remove this layer and all of its blocks."
                : "You need at least one layer.",
            )}
          />
        </HStack>
      </VStack>

      <Modal
        isOpen={confirmDelete.isOpen}
        onClose={confirmDelete.onClose}
        isCentered
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Delete {displayName}?</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              {blockCount > 0
                ? `Its ${blockCount} block${blockCount === 1 ? "" : "s"} will be removed. `
                : ""}
              This can&apos;t be undone.
            </Text>
          </ModalBody>
          <ModalFooter gap={3}>
            <Button variant="ghost" onClick={confirmDelete.onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={action(() => {
                store.removeLayer(layer);
                confirmDelete.onClose();
              })}
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
});
