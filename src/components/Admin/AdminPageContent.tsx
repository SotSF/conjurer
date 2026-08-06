import { observer } from "mobx-react-lite";
import {
  Badge,
  Box,
  Button,
  Code,
  Heading,
  HStack,
  Progress,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  useClipboard,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import type { IAudioMetadata } from "music-metadata";
import { trpc } from "@/src/utils/trpc";
import { useStore } from "@/src/types/StoreContext";
import type { Song } from "@/src/types/Song";
import { getSongUrl } from "@/src/utils/songUrl";
import {
  ASSET_BUCKET_NAME,
  ASSET_BUCKET_REGION,
  AUDIO_ASSET_PREFIX,
  LOCAL_ASSET_PATH,
} from "@/src/utils/assets";

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

function isVbrEncoding(encodingType: string) {
  return encodingType.startsWith("VBR") || encodingType.startsWith("V");
}

function shellEscape(value: string) {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function EncodingBadge({ encodingType }: { encodingType: string }) {
  const isCbr = encodingType.startsWith("CBR");
  const isVbr = isVbrEncoding(encodingType);

  return (
    <Badge
      colorScheme={isCbr ? "green" : isVbr ? "orange" : "gray"}
      fontSize="sm"
      px={2}
      py={0.5}
    >
      {encodingType}
    </Badge>
  );
}

type SongScanStatus = "pending" | "scanning" | "done" | "error";

type SongScanResult = {
  song: Song;
  status: SongScanStatus;
  encoding?: string;
  bitrate?: number;
  codecProfile?: string;
  duration?: number;
  error?: string;
  metadata?: IAudioMetadata;
};

function MetadataDetail({ metadata }: { metadata: IAudioMetadata }) {
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

function buildCbrConversionScript(
  vbrSongs: Song[],
  usingLocalData: boolean,
): string {
  if (vbrSongs.length === 0) {
    return "# No variable-bitrate songs found.\n";
  }

  const lines: string[] = [
    "#!/usr/bin/env bash",
    "# Convert VBR audio to 256k CBR and replace the originals.",
    "# Requires: curl, ffmpeg, and (for S3) AWS CLI credentials with put access.",
    "# Wavesurfer desyncs on VBR — prefer constant bitrate 256k/320k.",
    "# Run from the conjurer repo root so relative local paths resolve.",
    "set -euo pipefail",
    "",
    'REPO_ROOT="$(pwd)"',
    'WORKDIR="${TMPDIR:-/tmp}/conjurer-cbr-convert"',
    'mkdir -p "$WORKDIR"',
    "",
  ];

  if (usingLocalData) {
    const localAudioDir = `${LOCAL_ASSET_PATH}${AUDIO_ASSET_PREFIX}`
      .replace(/^\.\//, "")
      .replace(/\/+$/, "");
    lines.push(
      `# Local asset directory (anchored to repo root; do not cd away)`,
      `LOCAL_AUDIO_DIR="$REPO_ROOT/${localAudioDir}"`,
      "",
      "convert_local() {",
      '  local filename="$1"',
      '  local src="$LOCAL_AUDIO_DIR/$filename"',
      '  local tmp="$WORKDIR/cbr-$filename"',
      '  echo "=== Converting (local): $filename ==="',
      '  if [[ ! -f "$src" ]]; then',
      '    echo "Missing local file: $src" >&2',
      "    return 1",
      "  fi",
      '  case "$filename" in',
      "    *.m4a|*.M4A|*.aac|*.AAC)",
      '      ffmpeg -y -i "$src" -c:a aac -b:a 256k -map a "$tmp"',
      "      ;;",
      "    *)",
      '      ffmpeg -y -i "$src" -c:a libmp3lame -b:a 256k -map a "$tmp"',
      "      ;;",
      "  esac",
      '  mv "$tmp" "$src"',
      '  echo "Replaced $src"',
      "}",
      "",
    );

    for (const song of vbrSongs) {
      lines.push(`convert_local ${shellEscape(song.filename)}`);
    }
  } else {
    const bucketUri = `s3://${ASSET_BUCKET_NAME}/${AUDIO_ASSET_PREFIX}`;
    const s3Base = `https://${ASSET_BUCKET_NAME}.s3.${ASSET_BUCKET_REGION}.amazonaws.com/${AUDIO_ASSET_PREFIX}`;

    lines.push(
      `BUCKET_URI=${shellEscape(bucketUri)}`,
      "",
      "convert_and_replace() {",
      '  local filename="$1"',
      '  local url="$2"',
      '  local original="$WORKDIR/original-$filename"',
      '  local converted="$WORKDIR/cbr-$filename"',
      '  echo "=== Converting (S3): $filename ==="',
      '  curl -fsSL "$url" -o "$original"',
      '  case "$filename" in',
      "    *.m4a|*.M4A|*.aac|*.AAC)",
      '      ffmpeg -y -i "$original" -c:a aac -b:a 256k -map a "$converted"',
      '      content_type="audio/mp4"',
      "      ;;",
      "    *)",
      '      ffmpeg -y -i "$original" -c:a libmp3lame -b:a 256k -map a "$converted"',
      '      content_type="audio/mpeg"',
      "      ;;",
      "  esac",
      '  aws s3 cp "$converted" "$BUCKET_URI$filename" --content-type "$content_type"',
      '  rm -f "$original" "$converted"',
      '  echo "Uploaded $BUCKET_URI$filename"',
      "}",
      "",
    );

    for (const song of vbrSongs) {
      const url = `${s3Base}${song.filename}`;
      lines.push(
        `convert_and_replace ${shellEscape(song.filename)} ${shellEscape(url)}`,
      );
    }
  }

  lines.push("");
  return lines.join("\n");
}

export const AdminPageContent = observer(function AdminPageContent() {
  const store = useStore();
  const { usingLocalData } = store;

  const { isPending, data: songs } = trpc.song.listSongs.useQuery(
    { usingLocalData },
    { refetchOnWindowFocus: false },
  );

  const [results, setResults] = useState<SongScanResult[]>([]);
  const [scanKey, setScanKey] = useState(0);
  const [selectedFilename, setSelectedFilename] = useState<string | null>(null);

  useEffect(() => {
    if (!songs) return;

    let cancelled = false;

    setResults(
      songs.map((song) => ({
        song,
        status: "pending" as const,
      })),
    );
    setSelectedFilename(null);

    async function scanAll(songList: Song[]) {
      const { parseBlob } = await import("music-metadata");

      for (const song of songList) {
        if (cancelled) return;

        setResults((prev) =>
          prev.map((row) =>
            row.song.filename === song.filename
              ? { ...row, status: "scanning", error: undefined }
              : row,
          ),
        );

        try {
          const url = getSongUrl(song, usingLocalData);
          if (!url) throw new Error("Could not resolve song URL");

          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Failed to fetch audio (${response.status})`);
          }

          const blob = await response.blob();
          const metadata = await parseBlob(blob, { skipPostHeaders: true });
          if (cancelled) return;

          const encoding = getEncodingType(
            metadata.format.codecProfile,
            metadata.format.bitrate,
          );

          setResults((prev) =>
            prev.map((row) =>
              row.song.filename === song.filename
                ? {
                    ...row,
                    status: "done",
                    encoding,
                    bitrate: metadata.format.bitrate,
                    codecProfile: metadata.format.codecProfile,
                    duration: metadata.format.duration,
                    metadata,
                  }
                : row,
            ),
          );
        } catch (err) {
          if (cancelled) return;
          setResults((prev) =>
            prev.map((row) =>
              row.song.filename === song.filename
                ? {
                    ...row,
                    status: "error",
                    error:
                      err instanceof Error
                        ? err.message
                        : "Failed to parse metadata",
                  }
                : row,
            ),
          );
        }
      }
    }

    void scanAll(songs);

    return () => {
      cancelled = true;
    };
  }, [songs, usingLocalData, scanKey]);

  const scannedCount = results.filter(
    (row) => row.status === "done" || row.status === "error",
  ).length;
  const totalCount = results.length;
  const isScanning = results.some(
    (row) => row.status === "pending" || row.status === "scanning",
  );
  const progress = totalCount === 0 ? 0 : (scannedCount / totalCount) * 100;

  const vbrResults = useMemo(
    () =>
      results.filter(
        (row) => row.status === "done" && row.encoding && isVbrEncoding(row.encoding),
      ),
    [results],
  );

  const script = useMemo(
    () =>
      buildCbrConversionScript(
        vbrResults.map((row) => row.song),
        usingLocalData,
      ),
    [vbrResults, usingLocalData],
  );

  const { onCopy, hasCopied, setValue } = useClipboard(script);

  useEffect(() => {
    setValue(script);
  }, [script, setValue]);

  const selectedResult = results.find(
    (row) => row.song.filename === selectedFilename,
  );

  return (
    <VStack align="stretch" spacing={8} w="full">
      <Box>
        <HStack justify="space-between" mb={2}>
          <Heading size="md">Audio bitrate scan</Heading>
          <Button
            size="sm"
            onClick={() => setScanKey((key) => key + 1)}
            isDisabled={!songs || isScanning}
          >
            Rescan
          </Button>
        </HStack>
        <Text color="gray.400" fontSize="sm" mb={3}>
          Sequentially fetches each song and inspects MP3 encoding with
          music-metadata. VBR files are listed below with a conversion script.
        </Text>

        {isPending || !songs ? (
          <Spinner size="sm" />
        ) : (
          <>
            <HStack mb={2} spacing={3}>
              <Text fontSize="sm">
                {scannedCount} / {totalCount} scanned
                {isScanning ? "…" : ""}
              </Text>
              {isScanning && <Spinner size="xs" />}
              {!isScanning && (
                <Text fontSize="sm" color="orange.300">
                  {vbrResults.length} VBR
                </Text>
              )}
            </HStack>
            <Progress
              value={progress}
              size="sm"
              borderRadius="md"
              colorScheme={isScanning ? "blue" : "green"}
              mb={4}
            />
          </>
        )}
      </Box>

      <Box>
        <Heading size="sm" mb={3}>
          Variable bitrate songs
        </Heading>
        {vbrResults.length === 0 && !isScanning ? (
          <Text fontSize="sm" color="gray.400">
            {totalCount === 0
              ? "No songs found."
              : "No variable-bitrate songs detected."}
          </Text>
        ) : (
          <Box overflowX="auto">
            <Table size="sm" variant="simple">
              <Thead>
                <Tr>
                  <Th>Artist</Th>
                  <Th>Name</Th>
                  <Th>Filename</Th>
                  <Th>Encoding</Th>
                  <Th>Bitrate</Th>
                  <Th>Duration</Th>
                </Tr>
              </Thead>
              <Tbody>
                {vbrResults.map((row) => (
                  <Tr
                    key={row.song.filename}
                    cursor="pointer"
                    bg={
                      selectedFilename === row.song.filename
                        ? "whiteAlpha.100"
                        : undefined
                    }
                    _hover={{ bg: "whiteAlpha.50" }}
                    onClick={() => setSelectedFilename(row.song.filename)}
                  >
                    <Td>{row.song.artist || "—"}</Td>
                    <Td>{row.song.name}</Td>
                    <Td>
                      <Code fontSize="xs">{row.song.filename}</Code>
                    </Td>
                    <Td>
                      <EncodingBadge encodingType={row.encoding ?? "Unknown"} />
                    </Td>
                    <Td>{formatBitrate(row.bitrate)}</Td>
                    <Td>{formatDuration(row.duration)}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </Box>

      <Box>
        <Heading size="sm" mb={3}>
          All songs
        </Heading>
        <Box overflowX="auto" maxH="20rem" overflowY="auto">
          <Table size="sm" variant="simple">
            <Thead position="sticky" top={0} bg="gray.700" zIndex={1}>
              <Tr>
                <Th>Status</Th>
                <Th>Artist</Th>
                <Th>Name</Th>
                <Th>Encoding</Th>
                <Th>Bitrate</Th>
              </Tr>
            </Thead>
            <Tbody>
              {results.map((row) => (
                <Tr
                  key={row.song.filename}
                  cursor={row.status === "done" ? "pointer" : "default"}
                  bg={
                    selectedFilename === row.song.filename
                      ? "whiteAlpha.100"
                      : undefined
                  }
                  _hover={
                    row.status === "done" ? { bg: "whiteAlpha.50" } : undefined
                  }
                  onClick={() => {
                    if (row.status === "done") {
                      setSelectedFilename(row.song.filename);
                    }
                  }}
                >
                  <Td>
                    {row.status === "scanning" && <Spinner size="xs" />}
                    {row.status === "pending" && (
                      <Text fontSize="xs" color="gray.500">
                        pending
                      </Text>
                    )}
                    {row.status === "done" && (
                      <Text fontSize="xs" color="green.300">
                        done
                      </Text>
                    )}
                    {row.status === "error" && (
                      <Text fontSize="xs" color="red.300" title={row.error}>
                        error
                      </Text>
                    )}
                  </Td>
                  <Td>{row.song.artist || "—"}</Td>
                  <Td>{row.song.name}</Td>
                  <Td>
                    {row.encoding ? (
                      <EncodingBadge encodingType={row.encoding} />
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td>{formatBitrate(row.bitrate)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </Box>

      <Box>
        <HStack justify="space-between" mb={2}>
          <Heading size="sm">
            CBR conversion script ({vbrResults.length} files)
          </Heading>
          <Button
            size="sm"
            onClick={onCopy}
            isDisabled={vbrResults.length === 0}
          >
            {hasCopied ? "Copied" : "Copy"}
          </Button>
        </HStack>
        <Text color="gray.400" fontSize="sm" mb={3}>
          {usingLocalData
            ? "Downloads are skipped — converts files under public/cloud-assets/audio/ in place."
            : "Downloads each VBR file from S3, re-encodes to 256k CBR with ffmpeg, and uploads over the same key."}
        </Text>
        <Textarea
          value={script}
          readOnly
          fontFamily="mono"
          fontSize="xs"
          minH="16rem"
          whiteSpace="pre"
          overflowX="auto"
        />
      </Box>

      {selectedResult?.metadata && (
        <Box>
          <Heading size="sm" mb={3}>
            Details:{" "}
            {selectedResult.song.artist
              ? `${selectedResult.song.artist} - ${selectedResult.song.name}`
              : selectedResult.song.name}
          </Heading>
          <Text fontSize="sm" color="gray.400" mb={4}>
            File: <Code>{selectedResult.song.filename}</Code>
          </Text>
          <MetadataDetail metadata={selectedResult.metadata} />
        </Box>
      )}
    </VStack>
  );
});
