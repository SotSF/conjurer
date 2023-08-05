import { Store } from "@/src/types/Store";
import { createContext, useContext } from "react";

// Keep this in its own file so that it is not refreshed upon a next fast refresh
export const StoreContext = createContext<Store>(new Store("default"));
export const useStore = () => useContext(StoreContext);
