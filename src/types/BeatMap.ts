import { makeAutoObservable } from "mobx";

export class BeatMap {
  threshold: number;
  frequency: number;

  tempo: number;
  tempoOffset: number;

  constructor(tempo: number, tempoOffset: number) {
    this.threshold = 0.72;
    this.frequency = 150;

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

  serialize = () => ({
    threshold: this.threshold,
    frequency: this.frequency,
    tempo: this.tempo,
    tempoOffset: this.tempoOffset,
  });

  deserialize = (data: any) => {
    this.threshold = data.threshold ?? 0.72;
    this.frequency = data.frequency ?? 150;
    this.tempo = data.tempo ?? 120;
    this.tempoOffset = data.tempoOffset ?? 0;
  };
}
