import {Getter, GetterTree} from "vuex";
import {DataExplorationState} from "./dataExploration";

interface DataExplorationGetters {
    isGuest: Getter<DataExplorationState, DataExplorationState>
}

export const getters: DataExplorationGetters & GetterTree<DataExplorationState, DataExplorationState> = {
    isGuest: (state: DataExplorationState) => {
        return state.currentUser == "guest";
    }
}