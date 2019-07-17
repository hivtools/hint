import { GetterTree } from 'vuex';
import {RootState, BaselineState} from "../../types";

export const getters: GetterTree<BaselineState, RootState> = {
    country(state): string {
        return state.country
    }
};
