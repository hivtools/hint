import {DataExplorationState} from "./dataExploration";
import {mutations as languageMutations} from "../language/mutations";
import {MutationTree} from "vuex";

export const mutations: MutationTree<DataExplorationState> = {...languageMutations}
