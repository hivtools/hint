import {createLocalVue, shallowMount} from '@vue/test-utils';
import Vuex from 'vuex';
import CalibrationResults from "../../../app/components/modelCalibrate/CalibrationResults.vue";
import {
    mockBaselineState, mockCalibrateResultResponse,
    mockModelRunState, mockShapeResponse,
} from "../../mocks";
import {mutations as modelCalibrateMutations} from "../../../app/store/modelCalibrate/mutations";
import {mutations as plottingSelectionMutations} from "../../../app/store/plottingSelections/mutations";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {emptyState} from "../../../app/root";
import {inactiveFeatures} from "../../../app/main";
import {BarChartWithFilters} from "@reside-ic/vue-charts";
import {modelCalibrate, ModelCalibrateState} from "../../../app/store/modelCalibrate/modelCalibrate";
import {expectTranslated} from "../../testHelpers";
import {BarchartIndicator} from "../../../app/types";
import Vue from 'vue';

const localVue = createLocalVue();

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
                    calibratePlotResult: mockCalibrateResultResponse({data: ["TEST DATA"] as any}),
                    ...modelCalibrateState
                },
                namespaced: true,
                getters: {
                    indicators: jest.fn().mockReturnValue(["TEST BARCHART INDICATORS"]),
                    filters: jest.fn().mockReturnValue(["TEST BAR FILTERS"]),
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
                    calibratePlotDefaultSelections: jest.fn().mockReturnValue(defaultSelections),
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
    // beforeAll(async () => {
    //     inactiveFeatures.splice(0, inactiveFeatures.length);
    // });

    it("renders title and text", () => {
        const store = getStore();
        const wrapper = shallowMount(CalibrationResults, {localVue, store});
        const title = wrapper.find("h3");
        // expectTranslated(title, "Review calibration results", "Examiner les résultats de l'étalonnage", store);
        // const text = wrapper.find("p");
        // expectTranslated(text, "Comparison of unadjusted estimates (uncalibrated) to model estimates calibrated to spectrum results as specified in calibration options above.", "Comparaison des estimations non ajustées (non calibrées) aux estimations du modèle calées sur les résultats du spectre comme spécifié dans les options de calage ci-dessus.", store);
    });

    it("renders barchart", async () => {
        const store = getStore();
        const wrapper = shallowMount(CalibrationResults, {localVue, store});
        const barchart = wrapper.find(BarChartWithFilters);
        await Vue.nextTick();
        const vm = wrapper.vm as any;
        expect(barchart.props().chartData).toStrictEqual(["TEST DATA"]);
        expect(barchart.props().filterConfig).toBe(vm.filterConfig);
        expect(barchart.props().indicators).toStrictEqual(["TEST BARCHART INDICATORS"]);
        expect(barchart.props().selections).toBe(vm.selections);
        expect(barchart.props().formatFunction).toBe(vm.formatBarchartValue);
    });

    it("computes chartdata", () => {
        const store = getStore();
        const wrapper = shallowMount(CalibrationResults, {store, localVue});
        const vm = (wrapper as any).vm;

        expect(vm.chartData).toStrictEqual(["TEST DATA"]);
    });

    it("computes barchart selections", () => {
        const store = getStore();
        const wrapper = shallowMount(CalibrationResults, {store, localVue});
        const vm = (wrapper as any).vm;

        expect(vm.selections).toStrictEqual({
            ...defaultSelections,
            indicatorId: "TestIndicator",
            xAxisId: "spectrumRegionName",
            disaggregateById: "dataType",
            selectedFilterOptions: {
                ...defaultSelections.selected_filter_options,
                sex: [{ id: "male", label: "Male" }],
                dataType: [
                    { id: "spectrum", label: "spectrum" },
                    { id: "unadjusted", label: "unadjusted" },
                    { id: "calibrated", label: "calibrated" },
                ],
                spectrumRegionName: [
                    { id: "Northern", label: "Northern" },
                    { id: "Southern", label: "Southern" },
                ]
            }
        });
    });

    it("computes barchart filters", () => {
        const store = getStore();
        const wrapper = shallowMount(CalibrationResults, {store, localVue});
        const vm = (wrapper as any).vm;

        expect(vm.filterConfig).toStrictEqual({
            indicatorLabel: "Indicator",
            xAxisLabel: "X Axis",
            disaggLabel: "Disaggregate by",
            filterLabel: "Filters",
            filters: ["TEST BAR FILTERS"]
        });
    });

    it("formatBarchartValue formats value", () => {
        const store = getStore();
        const wrapper = shallowMount(CalibrationResults, {store, localVue});

        const indicator: BarchartIndicator = {
            indicator: "testIndicator",
            value_column: "val_col",
            indicator_column: "ind_col",
            indicator_value: "",
            name: "Test Indicator",
            error_low_column: "err_lo",
            error_high_column: "err_hi",
            format: "0.00%",
            scale: 1,
            accuracy: null
        };
        expect((wrapper.vm as any).formatBarchartValue(0.29, indicator)).toBe("29.00%");

        indicator.format = "0";
        indicator.scale = 10;
        indicator.accuracy = 100;
        expect((wrapper.vm as any).formatBarchartValue(4231, indicator)).toBe("42300");
    });
});
