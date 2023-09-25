import { makeAutoObservable } from "mobx";

export class SongMetadata {
  tempo: number;
  tempoOffset: number;

  constructor(tempo: number, tempoOffset: number) {
    this.tempo = tempo;
    this.tempoOffset = tempoOffset;

    makeAutoObservable(this);
  }

  get beatDuration() {
    return 60 / this.tempo;
  }

  nearestBeatTime = (time: number) =>
    Math.max(
      0,
      Math.floor(
        (time - this.tempoOffset + this.beatDuration / 2) / this.beatDuration
      ) *
        this.beatDuration +
        this.tempoOffset
    );
}
