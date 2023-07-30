import { Timer } from "@/src/types/Timer";
import { makeAutoObservable, runInAction } from "mobx";
import initialPlaylist from "@/src/data/initialPlaylist.json";

export class PlaylistStore {
  name: string = "";
  experiences: string[] = [];

  constructor(readonly timer: Timer) {
    makeAutoObservable(this);

    runInAction(() => this.initialize());
  }

  initialize = () => {
    this.name = initialPlaylist.name;
    this.experiences = initialPlaylist.experiences;
  };
}
