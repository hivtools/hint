import { GetterTree } from 'vuex';
import {BaselineState} from "./baseline";
import {RootState} from "../../types";

export const getters: GetterTree<BaselineState, RootState> = {
    country(state): string {
        return state.country
    }
};
