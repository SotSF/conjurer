import { observer } from "mobx-react-lite";
import {
  Badge,
  Box,
  Code,
  Heading,
  Select,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import type { IAudioMetadata } from "music-metadata";
import { trpc } from "@/src/utils/trpc";
import { useStore } from "@/src/types/StoreContext";
import type { Song } from "@/src/types/Song";
import { getSongUrl } from "@/src/utils/songUrl";

function formatBitrate(bitrate?: number) {
  if (!bitrate) return "—";
  return `${Math.round(bitrate / 1000)} kbps`;
}

function formatDuration(duration?: number) {
  if (!duration) return "—";
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function getEncodingType(codecProfile?: string, bitrate?: number) {
  if (codecProfile) {
    if (codecProfile === "CBR") return "CBR";
    if (codecProfile.startsWith("V")) return "VBR";
    return codecProfile;
  }

  if (!bitrate) return "Unknown";

  const kbps = bitrate / 1000;
  const standardCbrRates = [320, 256, 192, 160, 128, 64];
  const isStandardCbr = standardCbrRates.some(
    (rate) => Math.abs(kbps - rate) < 0.01,
  );
  return isStandardCbr ? "CBR (likely)" : "VBR (likely)";
}

function EncodingBadge({ encodingType }: { encodingType: string }) {
  const isCbr = encodingType.startsWith("CBR");
  const isVbr = encodingType.startsWith("VBR") || encodingType.startsWith("V");

  return (
    <Badge
      colorScheme={isCbr ? "green" : isVbr ? "orange" : "gray"}
      fontSize="md"
      px={3}
      py={1}
    >
      {encodingType}
    </Badge>
  );
}

function MetadataTable({ metadata }: { metadata: IAudioMetadata }) {
  const { format, common } = metadata;
  const encodingType = getEncodingType(format.codecProfile, format.bitrate);

  const formatRows = [
    ["Encoding", encodingType],
    ["Codec profile", format.codecProfile ?? "—"],
    ["Container", format.container ?? "—"],
    ["Codec", format.codec ?? "—"],
    ["Bitrate", formatBitrate(format.bitrate)],
    ["Duration", formatDuration(format.duration)],
    ["Sample rate", format.sampleRate ? `${format.sampleRate} Hz` : "—"],
    ["Channels", format.numberOfChannels?.toString() ?? "—"],
    ["Bits per sample", format.bitsPerSample?.toString() ?? "—"],
    ["Lossless", format.lossless == null ? "—" : format.lossless ? "Yes" : "No"],
  ] as const;

  const tagRows = [
    ["Title", common.title ?? "—"],
    ["Artist", common.artist ?? "—"],
    ["Album", common.album ?? "—"],
    ["Album artist", common.albumartist ?? "—"],
    ["Track", common.track?.no?.toString() ?? "—"],
    ["Year", common.year?.toString() ?? "—"],
    ["Genre", common.genre?.join(", ") ?? "—"],
  ] as const;

  return (
    <VStack align="stretch" spacing={6} w="full">
      <Box>
        <Text mb={2} fontWeight="semibold">
          Bitrate encoding
        </Text>
        <EncodingBadge encodingType={encodingType} />
      </Box>

      <Box>
        <Heading size="sm" mb={3}>
          Format
        </Heading>
        <Table size="sm" variant="simple">
          <Thead>
            <Tr>
              <Th>Property</Th>
              <Th>Value</Th>
            </Tr>
          </Thead>
          <Tbody>
            {formatRows.map(([property, value]) => (
              <Tr key={property}>
                <Td fontWeight="medium">{property}</Td>
                <Td>{value}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      <Box>
        <Heading size="sm" mb={3}>
          Tags
        </Heading>
        <Table size="sm" variant="simple">
          <Thead>
            <Tr>
              <Th>Property</Th>
              <Th>Value</Th>
            </Tr>
          </Thead>
          <Tbody>
            {tagRows.map(([property, value]) => (
              <Tr key={property}>
                <Td fontWeight="medium">{property}</Td>
                <Td>{value}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      <Box>
        <Heading size="sm" mb={3}>
          Raw metadata
        </Heading>
        <Code
          display="block"
          whiteSpace="pre-wrap"
          p={4}
          borderRadius="md"
          fontSize="xs"
          overflowX="auto"
          maxH="24rem"
          overflowY="auto"
        >
          {JSON.stringify(metadata, null, 2)}
        </Code>
      </Box>
    </VStack>
  );
}

export const AdminPageContent = observer(function AdminPageContent() {
  const store = useStore();
  const { usingLocalData } = store;

  const { isPending, data: songs } = trpc.song.listSongs.useQuery(
    { usingLocalData },
    { refetchOnWindowFocus: false },
  );

  const [selectedFilename, setSelectedFilename] = useState("");
  const [metadata, setMetadata] = useState<IAudioMetadata | null>(null);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSong = songs?.find((song) => song.filename === selectedFilename);

  useEffect(() => {
    if (!selectedSong?.filename) {
      setMetadata(null);
      setError(null);
      return;
    }

    let cancelled = false;

    async function loadMetadata(song: Song) {
      setLoadingMetadata(true);
      setError(null);
      setMetadata(null);

      try {
        const url = getSongUrl(song, usingLocalData);
        if (!url) throw new Error("Could not resolve song URL");

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch audio (${response.status})`);
        }

        const blob = await response.blob();
        const { parseBlob } = await import("music-metadata");
        const result = await parseBlob(blob, { skipPostHeaders: true });

        if (!cancelled) setMetadata(result);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to parse metadata");
        }
      } finally {
        if (!cancelled) setLoadingMetadata(false);
      }
    }

    loadMetadata(selectedSong);

    return () => {
      cancelled = true;
    };
  }, [selectedSong, usingLocalData]);

  return (
    <VStack align="stretch" spacing={6} w="full">
      <Box>
        <Text mb={2} fontWeight="semibold">
          Song
        </Text>
        {isPending || !songs ? (
          <Spinner size="sm" />
        ) : (
          <Select
            placeholder="Select a song..."
            value={selectedFilename}
            onChange={(e) => setSelectedFilename(e.target.value)}
            maxW="md"
          >
            {songs.map((song) => (
              <option key={song.filename} value={song.filename}>
                {song.artist ? `${song.artist} - ${song.name}` : song.name}
              </option>
            ))}
          </Select>
        )}
      </Box>

      {selectedSong && (
        <Text fontSize="sm" color="gray.400">
          File: <Code>{selectedSong.filename}</Code>
        </Text>
      )}

      {loadingMetadata && (
        <Box>
          <Spinner size="sm" mr={2} />
          <Text as="span" fontSize="sm">
            Parsing metadata...
          </Text>
        </Box>
      )}

      {error && (
        <Text color="red.400" fontSize="sm">
          {error}
        </Text>
      )}

      {metadata && !loadingMetadata && <MetadataTable metadata={metadata} />}
    </VStack>
  );
});
