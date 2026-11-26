import {shallowMount} from "@vue/test-utils";
import ModelOutput from "../../../app/components/modelOutput/ModelOutput.vue";
import Vuex, {type Store} from "vuex";
import {emptyState, type RootState} from "../../../app/root";
import {mockError, mockModelCalibrateState, mockModelOutputState} from "../../mocks";
import ErrorAlert from "../../../app/components/ErrorAlert.vue";
import {initialPlotSelectionsState} from "../../../app/store/plotSelections/plotSelections";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import PlotControlSet from "../../../app/components/plots/PlotControlSet.vue";
import FilterSet from "../../../app/components/plots/FilterSet.vue";
import Choropleth from "../../../app/components/plots/choropleth/Choropleth.vue";
import Bubble from "../../../app/components/plots/bubble/Bubble.vue";
import Barchart from "../../../app/components/plots/bar/Barchart.vue";
import Table from "../../../app/components/plots/table/Table.vue";
import {ModelOutputMutation} from "../../../app/store/modelOutput/mutations";

describe("Model Output page", () => {
    const getWrapper = (store: Store<RootState>) => {
        return shallowMount(ModelOutput, {
            global: {
                plugins: [store]
            }
        })
    };

    const mockTabSelected = vi.fn();

    const createStore = (plotDataError: ReturnType<typeof mockError> | null = null) => {
        const store = new Vuex.Store({
            state: emptyState("some.user@example.com"),
            modules: {
                modelOutput: {
                    namespaced: true,
                    state: mockModelOutputState({
                        selectedTab: "choropleth"
                    }),
                    mutations: {
                        [ModelOutputMutation.TabSelected]: mockTabSelected
                    }
                },
                modelCalibrate: {
                    namespaced: true,
                    state: mockModelCalibrateState({
                        metadata: {} as any
                    })
                },
                plotSelections: {
                    namespaced: true,
                    state: {...initialPlotSelectionsState(), error: plotDataError}
                }
            }
        });
        registerTranslations(store);
        return store;
    };

    test("renders as expected", () => {
        const store = createStore();
        const wrapper = getWrapper(store);

        const plotTabs = wrapper.findAll(".nav-link");
        expect(plotTabs.length).toBe(6);
        expect(plotTabs[0].classes()).contains("active");
        expect(plotTabs[1].classes()).not.contains("active");
        expect(plotTabs[2].classes()).not.contains("active");
        expect(plotTabs[3].classes()).not.contains("active");
        expect(plotTabs[4].classes()).not.contains("active");
        expect(plotTabs[5].classes()).not.contains("active");
        expect(wrapper.findComponent(PlotControlSet).exists()).toBeTruthy();
        expect(wrapper.findComponent(FilterSet).exists()).toBeTruthy();
        expect(wrapper.findComponent(Choropleth).exists()).toBeTruthy();
        expect(wrapper.findComponent(Bubble).exists()).toBeFalsy();
        expect(wrapper.findComponent(Barchart).exists()).toBeFalsy();
        expect(wrapper.findComponent(Table).exists()).toBeFalsy();

        plotTabs[1].trigger("click");
        expect(mockTabSelected.mock.calls.length).toBe(1);
        expect(mockTabSelected.mock.calls[0][1]).toStrictEqual({
            payload: "barchart"
        })
    });

    test("shows no error when the plot data fetch did not fail", () => {
        const wrapper = getWrapper(createStore());
        expect(wrapper.findComponent(ErrorAlert).exists()).toBeFalsy();
    });

    test("shows the error from the plot data fetch above the plot", () => {
        const store = createStore(mockError("Plot data failed"));
        const wrapper = getWrapper(store);

        const errorAlert = wrapper.findComponent(ErrorAlert);
        expect(errorAlert.exists()).toBeTruthy();
        expect(errorAlert.props("error")).toStrictEqual({
            error: "OTHER_ERROR",
            detail: "Plot data failed"
        });
        // The controls stay, so the user can change the selections and try again.
        expect(wrapper.findComponent(PlotControlSet).exists()).toBeTruthy();
        expect(wrapper.findComponent(Choropleth).exists()).toBeTruthy();
    });
});
