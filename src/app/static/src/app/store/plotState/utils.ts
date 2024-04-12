import {CalibrateMetadataResponse} from "../../generated";
import {Commit} from "vuex";
import {initialScaleSettings, ScaleSettings} from "./plotState";
import {Dict} from "../../types";
import {PlotStateMutations} from "./mutations";

export const commitInitialScaleSelections = (
    metadata: CalibrateMetadataResponse,
    commit: Commit
) => {

    const newScaleSettings = metadata.indicators.reduce((dict, meta) => {
        dict[meta.indicator] = initialiseScaleFromMetadata(meta);
        return dict
    }, {} as Dict<ScaleSettings>)
    commit({
            type: `plotState/${PlotStateMutations.setOutputColourScales}`,
            payload: newScaleSettings},
        { root: true }
    );
};

const initialiseScaleFromMetadata = (meta: CalibrateMetadataResponse["indicators"][0]): ScaleSettings => {
    const scaleSettings = initialScaleSettings();
    scaleSettings.customMin = meta.min;
    scaleSettings.customMax = meta.max;
    return scaleSettings;
};
