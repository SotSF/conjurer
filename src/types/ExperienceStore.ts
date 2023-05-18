import { makeAutoObservable } from "mobx";

interface RootStore {
  serialize: () => any;
}

export class ExperienceStore {
  rootStore: RootStore;

  constructor(rootStore: RootStore) {
    makeAutoObservable(this);

    this.rootStore = rootStore;
  }

  serialize = () => ({});

  deserialize = (data: any) => {};
}
