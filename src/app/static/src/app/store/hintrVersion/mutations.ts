import type { MutationTree } from 'vuex';
import type { HintrVersionResponse } from '../../generated';
import type { PayloadWithType } from "../../types";
import type { HintrVersionState } from './hintrVersion';


export enum HintrVersionMutation {
    HintrVersionFetched = "HintrVersionFetched"
}

export const mutations: MutationTree<HintrVersionState> = {

    [HintrVersionMutation.HintrVersionFetched](state: HintrVersionState, action: PayloadWithType<HintrVersionResponse>) {
        state.hintrVersion = action.payload;
    }
};
