import { User } from "@/src/types/User";
import { trpcClient } from "@/src/utils/trpc";
import { makeAutoObservable } from "mobx";

type RootStore = {
  context: string;
  usingLocalData: boolean;
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

  initialize = async () => {
    this._lastAuthenticatedUsername =
      localStorage.getItem("lastAuthenticatedUsername") || "";

    if (!this._lastAuthenticatedUsername) return;
    this.me = (await this.fetchUser(this._lastAuthenticatedUsername)) ?? null;
  };

  fetchUser = async (username: string) => {
    return await trpcClient.user.getUser.query({
      username,
      usingLocalData: this.rootStore.usingLocalData,
    });
  };
}
