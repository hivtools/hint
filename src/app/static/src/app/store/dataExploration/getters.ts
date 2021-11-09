import {Getter, GetterTree} from "vuex";
import {Error} from "../../generated"
import {extractErrors} from "../../utils";
import {DataExplorationState} from "./dataExploration";

interface DataExplorationGetters {
    isGuest: Getter<DataExplorationState, DataExplorationState>
    errors: Getter<DataExplorationState, DataExplorationState>
}

export const getters: DataExplorationGetters & GetterTree<DataExplorationState, DataExplorationState> = {
    isGuest: (state: DataExplorationState) => {
        return state.currentUser == "guest";
    },

    errors: (state: DataExplorationState) => {
        const {
            adr,
            adrUpload,
            baseline,
            metadata,
            plottingSelections,
            surveyAndProgram
        } = state;

        return ([] as Error[]).concat.apply([] as Error[], [extractErrors(adr),
            extractErrors(adrUpload),
            extractErrors(baseline),
            extractErrors(metadata),
            extractErrors(plottingSelections),
            extractErrors(surveyAndProgram),
            state.errors.errors]);
    }
}
