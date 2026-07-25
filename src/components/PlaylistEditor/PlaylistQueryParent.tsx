import { useStore } from "@/src/types/StoreContext";
import { playlistToQueryParam } from "@/src/types/Playlist";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import { ReactNode, useEffect } from "react";

/** Mirrors selected playlist to `?playlist=` for shareable/bookmarkable URLs. */
export const PlaylistQueryParent = observer(function PlaylistQueryParent({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const { playlistStore } = useStore();
  const selectedId = playlistStore.selectedPlaylist?.id;
  const queryParam =
    selectedId == null ? null : playlistToQueryParam(selectedId);

  useEffect(() => {
    if (!router.isReady || queryParam == null) return;
    if (router.query.playlist === queryParam) return;

    void router.replace(
      {
        pathname: router.pathname,
        query: { ...router.query, playlist: queryParam },
      },
      undefined,
      { shallow: true },
    );
  }, [router, queryParam]);

  return <>{children}</>;
});
