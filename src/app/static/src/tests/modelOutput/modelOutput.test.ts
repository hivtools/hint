import {modelOutputGetters} from "../../app/store/modelOutput/modelOutput";
import {
    mockBaselineState,
    mockModelResultResponse, mockModelRunState,
    mockRootState, mockShapeResponse
} from "../mocks";

describe("modelOutput module", () => {
    it("gets barchart indicators", async () => {
        const result = modelOutputGetters.barchartIndicators({}, null, mockRootState());
        expect(result.length).toEqual(7);
    });

    it("gets barchart filters", async () => {
        const rootState = mockRootState({
            baseline: mockBaselineState({
                shape: mockShapeResponse({
                    filters: {
                        regions: {
                            label: "label 1",
                            id: "id1",
                            children: []
                        }
                    }
                })
            }),
            modelOutput: {
                namespaced: true,
                getters: {
                    barchartFilters: () => [],
                    barchartIndicators: () => []
                }
            },
            modelRun: mockModelRunState({
                result: mockModelResultResponse({
                    filters: {
                        age: [ {id: "1", label: "0-4"}],
                        quarter: [{id: "11", label: "Jan-Mar 2016"}],
                        indicators: []
                    }
                })
            })
        });

        const result = modelOutputGetters.barchartFilters({}, null, rootState);
        expect(result.length).toEqual(4);
        expect (result[0]).toStrictEqual({
            id: "age",
            column_id: "age_group_id",
            label: "Age group",
            options: [
                {id: "1", label: "0-4"}
            ]
        });
        expect (result[1]).toStrictEqual({
            id: "sex",
            column_id: "sex",
            label: "Sex",
            options: [
                {id: "female", label: "female"},
                {id: "male", label: "male"},
                {id: "both", label: "both"}
            ]
        });
        expect (result[2]).toStrictEqual({
            id: "region",
            column_id: "area_id",
            label: "Region",
            options: [
                {id: "id1", label: "label 1", children: []}
            ]
        });
        expect (result[3]).toStrictEqual({
            id: "quarter",
            column_id: "quarter_id",
            label: "Quarter",
            options: [
                {id: "11", label: "Jan-Mar 2016"}
            ]
        });
    });
});