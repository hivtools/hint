import {shallowMount} from "@vue/test-utils";
import ModelOutput from "../../../src/components/modelOutput/ModelOutput.vue";
import Vuex, {Store} from "vuex";
import {emptyState, RootState} from "../../../src/root";
import {mockModelCalibrateState, mockModelOutputState} from "../../mocks";
import registerTranslations from "../../../src/store/translations/registerTranslations";
import PlotControlSet from "../../../src/components/plots/PlotControlSet.vue";
import FilterSet from "../../../src/components/plots/FilterSet.vue";
import Choropleth from "../../../src/components/plots/choropleth/Choropleth.vue";
import Bubble from "../../../src/components/plots/bubble/Bubble.vue";
import Barchart from "../../../src/components/plots/bar/Barchart.vue";
import Table from "../../../src/components/plots/table/Table.vue";
import {ModelOutputMutation} from "../../../src/store/modelOutput/mutations";

describe("Model Output page", () => {
    const getWrapper = (store: Store<RootState>) => {
        return shallowMount(ModelOutput, {
            global: {
                plugins: [store]
            }
        })
    };

    const mockTabSelected = vi.fn();

    const createStore = () => {
        const store = new Vuex.Store({
            state: emptyState(),
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
});
