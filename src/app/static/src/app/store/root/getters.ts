import {RootState, storeOptions} from "../../root";
import {Getter, GetterTree} from "vuex";

interface RootGetters {
    currentUser: Getter<RootState, RootState>
}

export const getters: RootGetters & GetterTree<RootState, RootState> = {
    currentUser: (state: RootState, getters: any) => {
        return state.currentUser;
    }
};