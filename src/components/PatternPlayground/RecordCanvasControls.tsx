import { Button } from "@chakra-ui/react";
import { memo, useEffect, useRef, useState } from "react";

export const RecordCanvasControls = memo(function RecordCanvasControls() {
  // const store = useStore();

  const mediaRecorder = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    const canvas = document.querySelector("canvas")!;

    // frames per second argument
    const stream = canvas.captureStream(60);
    const recordedChunks: any[] = [];

    const mr = new MediaRecorder(stream, {
      mimeType: "video/webm; codecs=vp9",
      videoBitsPerSecond: 50000000,
    });

    function download() {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      document.body.appendChild(a);
      a.href = url;
      a.download = "test.webm";
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }

    mr.ondataavailable = function (event: BlobEvent) {
      if (event.data.size <= 0) return;
      recordedChunks.push(event.data);
      download();
    };

    mediaRecorder.current = mr;
  }, []);

  // const [duration, setDuration] = useState(5000);
  const [recording, setRecording] = useState(false);

  return (
    <>
      {/* <Input
        width={20}
        size="sm"
        value={duration}
        onChange={(e) => setDuration(+e.target.value)}
      /> */}

      <Button
        size="sm"
        onClick={() => {
          if (recording) {
            setRecording(false);
            mediaRecorder.current?.stop();
          } else {
            setRecording(true);
            mediaRecorder.current?.start();
          }
        }}
      >
        {recording ? "Stop" : "Record"}
      </Button>
    </>
  );
});
