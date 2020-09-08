import {RootState, storeOptions} from "../../root";
import {Getter, GetterTree} from "vuex";

interface RootGetters {
    isGuest: Getter<RootState, RootState>
}

export const getters: RootGetters & GetterTree<RootState, RootState> = {
    isGuest: (state: RootState, getters: any) => {
        // console.log('getter isGuest', state.currentUser == "guest")
        return state.currentUser == "guest";
    }
};