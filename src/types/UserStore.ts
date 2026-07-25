import type { Store } from "@/src/types/Store";
import { FullUser } from "@/src/types/User";
import { trpcClient } from "@/src/utils/trpc";
import { makeAutoObservable, runInAction } from "mobx";

export class UserStore {
  private _lastAuthenticatedUsername = "";
  get lastAuthenticatedUsername(): string {
    return this._lastAuthenticatedUsername;
  }
  set lastAuthenticatedUsername(value: string) {
    this._lastAuthenticatedUsername = value;
    localStorage.setItem("lastAuthenticatedUsername", value);
  }

  me: FullUser | null = null;

  get isAuthenticated() {
    return !!this.me;
  }

  get username(): string {
    return this.me?.username ?? "";
  }

  constructor(readonly store: Store) {
    makeAutoObservable(this);
  }

  setMe = (value: FullUser | null) => {
    this.me = value;
    if (value) this.lastAuthenticatedUsername = value.username;
  };

  initialize = async () => {
    runInAction(() => {
      this._lastAuthenticatedUsername =
        localStorage.getItem("lastAuthenticatedUsername") || "";
    });

    if (this._lastAuthenticatedUsername) {
      const user = await this.fetchUser(this._lastAuthenticatedUsername);
      runInAction(() => {
        this.setMe(user ?? null);
      });
    }

    runInAction(() => {
      if (!this.me) {
        this.lastAuthenticatedUsername = "";
        this.store.uiStore.showingUserPickerModal = true;
      }
    });
  };

  fetchUser = async (username: string) => {
    try {
      return await trpcClient.user.getUser.query({
        username,
        usingLocalData: this.store.usingLocalData,
      });
    } catch {
      // Stale localStorage username, or empty local DB on first run
      return null;
    }
  };
}
