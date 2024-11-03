import { Editable, EditableInput, EditablePreview } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Playlist } from "@/src/types/Playlist";
import { useSavePlaylist } from "@/src/hooks/playlist";

export const PlaylistNameEditable = observer(function PlaylistNameEditable({
  playlist,
  isEditable,
}: {
  playlist: Playlist;
  isEditable: boolean;
}) {
  const [playlistName, setPlaylistName] = useState(playlist.name);

  const { savePlaylist } = useSavePlaylist();

  return (
    <Editable
      placeholder="Playlist name"
      value={playlistName}
      onChange={(value) => setPlaylistName(value)}
      onSubmit={() =>
        savePlaylist({
          ...playlist,
          name: playlistName,
        })
      }
      fontSize={20}
      fontWeight="bold"
      textAlign="center"
      isDisabled={!isEditable}
    >
      <EditablePreview />
      <EditableInput _placeholder={{ color: "gray.600" }} />
    </Editable>
  );
});
