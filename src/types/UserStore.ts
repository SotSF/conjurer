import { User } from "@/src/types/User";
import { makeAutoObservable } from "mobx";

type RootStore = {
  context: string;
};

export class UserStore {
  me: User | null = null;

  get isAuthenticated() {
    return !!this.me;
  }

  private _lastAuthenticatedUsername = "";
  get lastAuthenticatedUsername(): string {
    return this._lastAuthenticatedUsername;
  }
  set lastAuthenticatedUsername(value: string) {
    this._lastAuthenticatedUsername = value;
    localStorage.setItem("lastAuthenticatedUsername", value);
  }

  constructor(readonly rootStore: RootStore) {
    makeAutoObservable(this);
  }

  initialize() {
    this._lastAuthenticatedUsername =
      localStorage.getItem("lastAuthenticatedUsername") || "";
  }
}
