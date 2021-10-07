import {RootState} from "../../root";
import {Getter, GetterTree} from "vuex";
import {Error} from "../../generated"

interface RootGetters {
    isGuest: Getter<RootState, RootState>
}

export const getters: RootGetters & GetterTree<RootState, RootState> = {
    isGuest: (state: RootState) => {
        return state.currentUser == "guest";
    },
    errors: (state: RootState) => {
        const {
            adr,
            adrUpload,
            baseline,
            downloadResults,
            load,
            metadata,
            modelCalibrate,
            modelOptions,
            modelOutput,
            plottingSelections,
            projects,
            surveyAndProgram
        } = state;

        return ([] as Error[]).concat.apply([] as Error[], [extractErrors(adr),
            extractErrors(adrUpload),
            extractErrors(baseline),
            extractErrors(downloadResults),
            extractErrors(load),
            extractErrors(metadata),
            extractErrors(modelCalibrate),
            extractErrors(modelOptions),
            extractErrors(modelOutput),
            extractErrors(plottingSelections),
            extractErrors(projects),
            extractErrors(surveyAndProgram),
            state.modelRun.errors,
            state.errors.errors]);
    }
}

const extractErrors = (state: any) => {
    const errors = [] as Error[];
    extractErrorsRecursively(state, errors);
    return errors;
}

const isComplexObject = (state: any) => {
    return typeof state === 'object' && !Array.isArray(state) && state !== null
}

const extractErrorsRecursively = (state: any, errors: Error[]) => {
    if (isComplexObject(state)) {
        const keys = Object.keys(state);
        const errorKeys = keys.filter(key => /error$/i.test(key));
        errors.push(...errorKeys.map(key => state[key]).filter(err => !!err && !!err.error));
        keys.forEach(key => extractErrorsRecursively(state[key], errors));
    }
};
