import {RootState} from "../../root";
import {Getter, GetterTree} from "vuex";

interface RootGetters {
    isGuest: Getter<RootState, RootState>
}

export const getters: RootGetters & GetterTree<RootState, RootState> = {
    isGuest: (state: RootState, getters: any) => {
        return state.currentUser == "guest";
    }
};