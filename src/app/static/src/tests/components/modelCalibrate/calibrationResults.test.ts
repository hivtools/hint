import Vuex from 'vuex';
import CalibrationResults from "../../../app/components/modelCalibrate/CalibrationResults.vue";
import {mockCalibratePlotResponse} from "../../mocks";
import {mutations as modelCalibrateMutations} from "../../../app/store/modelCalibrate/mutations";
import {mutations as plottingSelectionMutations} from "../../../app/store/plottingSelections/mutations";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {emptyState} from "../../../app/root";
import {ModelCalibrateState} from "../../../app/store/modelCalibrate/modelCalibrate";
import {expectTranslated, shallowMountWithTranslate} from "../../testHelpers";
import {nextTick} from 'vue';
import Barchart from "../../../app/components/plots/bar/Barchart.vue";

const defaultSelections = {
    indicator_id: "TestIndicator",
    x_axis_id: "spectrum_region",
    disaggregate_by_id: "type",
    selected_filter_options: {
        region: {id: "r1", label: "region 1"},
        age: {id: "a1", label: "0-4"}
    }
}

function getStore(modelCalibrateState: Partial<ModelCalibrateState> = {}, partialGetters = {}, partialSelections = {}) {
    const store = new Vuex.Store({
        state: emptyState(),
        modules: {
            modelCalibrate: {
                state: {
                    calibratePlotResult: mockCalibratePlotResponse({data: ["TEST DATA"] as any}),
                    ...modelCalibrateState
                },
                namespaced: true,
                getters: {
                    indicators: vi.fn().mockReturnValue(["TEST BARCHART INDICATORS"]),
                    filters: vi.fn().mockReturnValue(["TEST BAR FILTERS"]),
                    calibratePlotDefaultSelections: vi.fn().mockReturnValue(defaultSelections),
                    ...partialGetters
                },
                mutations: modelCalibrateMutations
            },
            plottingSelections: {
                namespaced: true,
                state: {
                    calibratePlot: defaultSelections,
                    ...partialSelections
                },
                getters: {
                    ...partialGetters
                },
                mutations: plottingSelectionMutations
            }
        }
    });
    registerTranslations(store);
    return store;
}

declare let currentUser: string;
currentUser = "guest";

describe("CalibrateResults component", () => {

    it("renders title and text", async () => {
        const store = getStore();
        const wrapper = shallowMountWithTranslate(CalibrationResults, store, {global: {plugins: [store]}});
        await nextTick();
        const title = wrapper.find("h3");
        await expectTranslated(title, "Review calibration results", "Examiner les résultats de l'étalonnage",
            "Revise os resultados da calibração", store);
        const text = wrapper.find("p");
        await expectTranslated(text, "Comparison of unadjusted estimates (uncalibrated) to model estimates calibrated to spectrum results as specified in calibration options above.",
            "Comparaison des estimations non ajustées (non calibrées) aux estimations du modèle calées sur les résultats du spectre comme spécifié dans les options de calage ci-dessus.",
            "Comparação de estimativas não ajustadas (não calibradas) com estimativas de modelo calibradas para resultados de espectro, conforme especificado nas opções de calibração acima.",
            store);
    });

    it("renders barchart", async () => {
        const store = getStore();
        const wrapper = shallowMountWithTranslate(CalibrationResults, store, {global: {plugins: [store]}});
        const barchart = wrapper.findComponent(Barchart);
        await nextTick();
        expect(barchart.props().plot).toStrictEqual("calibrate");
        expect(barchart.props().showErrorBars).toBe(false);
    });
});
