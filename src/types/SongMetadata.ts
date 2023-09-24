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

  nearestBeat = (time: number) =>
    Math.floor((time - this.tempoOffset) / this.beatDuration) *
      this.beatDuration +
    this.tempoOffset;
}
