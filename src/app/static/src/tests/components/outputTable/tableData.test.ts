import { shallowMount } from "@vue/test-utils";
import TableData from "../../../app/components/outputTable/TableData.vue";
import Vuex from "vuex";
import { mockModelCalibrateState, mockPlottingSelections } from "../../mocks";
import TableReshapeData from "../../../app/components/outputTable/TableReshapeData.vue";

const mockFilters = [{
    id: "filter1",
    column_id: "col_id_filter_1",
    label: "Label",
    options: [{id: "op1", label: "option1"}, {id: "op2", label: "option2"}]
}];

describe("Output Table display table tests", () => {
    const createStore = (indicatorId: string, filterOptionId: string) => new Vuex.Store({
        getters: {
            ["modelOutput/tableFilters"]: jest.fn().mockReturnValue(mockFilters)
        },
        modules: {
            modelCalibrate: {
                namespaced: true,
                state: mockModelCalibrateState({
                    metadata: {
                        tableMetadata: {
                            presets: []
                        },
                        plottingMetadata: {
                            barchart: {indicators: [], filters: []},
                            choropleth: {indicators: [{indicator: "pop", name: "Pop"}, {indicator: "pop2", name: "Pop2"}] as any, filters: []}
                        },
                        warnings: []
                    },
                    result: {
                        data: [
                            {
                                id: 1,
                                indicator: "pop",
                                col_id_filter_1: "op2"
                            },
                            {
                                id: 2,
                                indicator: "pop2",
                                col_id_filter_1: "op1"
                            },
                            {
                                id: 3,
                                indicator: "pop",
                                col_id_filter_1: "op1"
                            },
                        ] as any
                    }
                })
            },
            plottingSelections: {
                namespaced: true,
                state: mockPlottingSelections({
                    table: {
                        preset: "",
                        indicator: indicatorId,
                        selectedFilterOptions: {
                            filter1: [{id: filterOptionId, label: filterOptionId}]
                        }
                    }
                })
            }
        }
    });
    const getWrapper = (indicatorId: string, filterOptionId: string) => {
        const store = createStore(indicatorId, filterOptionId);
        return shallowMount(TableData, {
            global: {
                plugins: [store]
            }
        });
    };

    it("filters data and renders as expected", () => {
        const wrapper = getWrapper("pop", "op1");
        expect(wrapper.findComponent(TableReshapeData).props("data")).toStrictEqual([
            {id: 3, indicator: "pop", col_id_filter_1: "op1"}
        ]);

        const wrapper1 = getWrapper("pop2", "op1");
        expect(wrapper1.findComponent(TableReshapeData).props("data")).toStrictEqual([
            {id: 2, indicator: "pop2", col_id_filter_1: "op1"}
        ]);

        const wrapper2 = getWrapper("pop", "op2");
        expect(wrapper2.findComponent(TableReshapeData).props("data")).toStrictEqual([
            {id: 1, indicator: "pop", col_id_filter_1: "op2"}
        ]);

        const wrapper3 = getWrapper("pop2", "op2");
        expect(wrapper3.findComponent(TableReshapeData).props("data")).toStrictEqual([]);
    });
});