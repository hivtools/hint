import {modelOutputGetters} from "../../app/store/modelOutput/modelOutput";
import {
    mockBaselineState, mockModelOutputState,
    mockModelResultResponse,
    mockModelRunState,
    mockRootState,
    mockShapeResponse
} from "../mocks";
import {Filter} from "../../app/types";


describe("modelOutput module", () => {

    const filters = [
        {id: "age", column_id: "age_group_id", label: "Age", options: []},
        {id: "quarter", column_id: "quarter_id", label: "Quarter", options: []},
        {id: "area", column_id: "area_id", label: "Area", options: [], use_shape_regions: true},
    ];

    const modelRunResponse = mockModelResultResponse({
        plottingMetadata: {
            barchart: {
                filters,
                indicators: [
                    {
                        error_high_column: "upper",
                        error_low_column: "lower",
                        indicator: "prevalence",
                        indicator_column: "indicator_id",
                        indicator_value: "2",
                        name: "Prevalence",
                        value_column: "mean",
                        format: "0.00%",
                        scale: 1,
                        accuracy: null
                    },
                    {
                        error_high_column: "upper",
                        error_low_column: "lower",
                        indicator: "art_coverage",
                        indicator_column: "indicator_id",
                        indicator_value: "4",
                        name: "ART coverage",
                        value_column: "mean",
                        format: "0.00%",
                        scale: 1,
                        accuracy: null
                    }
                ]
            },
            choropleth: {
                filters,
                indicators: []
            }

        }
    });

    const rootState = mockRootState({
        baseline: mockBaselineState({
            shape: mockShapeResponse({
                filters: {
                    regions: {
                        label: "label 1",
                        id: "id1",
                        children: [{id: "child1", label: "child label 1"}]
                    }
                }
            })
        }),
        modelOutput: mockModelOutputState(),
        modelRun: mockModelRunState({
            result: modelRunResponse
        })
    });

    it("gets barchart indicators", async () => {
        const result = modelOutputGetters.barchartIndicators(mockModelOutputState(), null, rootState);
        expect(result.length).toEqual(2);
        expect(result).toBe(modelRunResponse.plottingMetadata.barchart.indicators);
    });


    it("gets barchart filters", async () => {
        const result = modelOutputGetters.barchartFilters(mockModelOutputState(), null, rootState);
        expectOutputPlotFilters(result);
    });

    it("gets bubble plot indicators", async () => {
        const testRootGetters = {
            "metadata/outputIndicatorsMetadata": ["TEST INDICATORS"]
        };

        const result = modelOutputGetters.bubblePlotIndicators(mockModelOutputState(), null, rootState, testRootGetters);
        expect(result).toStrictEqual(["TEST INDICATORS"]);
    });

    it("gets bubble plot filters", async () => {
        const result = modelOutputGetters.bubblePlotFilters(mockModelOutputState(), null, rootState, null);
        expectOutputPlotFilters(result);
    });

    it("gets choropleth indicators", async () => {
        const testRootGetters = {
            "metadata/outputIndicatorsMetadata": ["TEST INDICATORS"]
        };

        const result = modelOutputGetters.choroplethIndicators(mockModelOutputState(), null, rootState, testRootGetters);
        expect(result).toStrictEqual(["TEST INDICATORS"]);
    });

    it("gets choropleth filters", async () => {
        const result = modelOutputGetters.choroplethFilters(mockModelOutputState(), null, rootState, null);
        expect(result.length).toEqual(3);
        expect(result[0]).toStrictEqual({
            id: "area",
            column_id: "area_id",
            label: "Area",
            use_shape_regions: true,
            allowMultiple: true,
            options: [{id: "child1", label: "child label 1"}]
        });
        expect(result[1]).toStrictEqual({
            id: "age",
            column_id: "age_group_id",
            label: "Age",
            allowMultiple: false,
            options: []
        });
        expect(result[2]).toStrictEqual({
            id: "quarter",
            column_id: "quarter_id",
            label: "Quarter",
            allowMultiple: false,
            options: []
        });
    });

    it("gets countryAreaFilterOption", async () => {
        const result = modelOutputGetters.countryAreaFilterOption(mockModelOutputState(), null, rootState, null);
        expect(result).toStrictEqual({
            children: [{id: "child1", label: "child label 1"}],
            id: "id1",
            label: "label 1"
        });
    });

    it("gets hasChanges", async () => {
        const result = modelOutputGetters.hasChanges(mockModelOutputState());
        expect(result).toStrictEqual(false);
    });

    const expectOutputPlotFilters = (filters: Filter[]) => {
        expect(filters.length).toEqual(3);
        expect(filters[0]).toStrictEqual({
            id: "area",
            column_id: "area_id",
            label: "Area",
            use_shape_regions: true,
            options: [
                {id: "id1", label: "label 1", children: [{id: "child1", label: "child label 1"}]}
            ]
        });
        expect(filters[1]).toStrictEqual(modelRunResponse.plottingMetadata.barchart.filters[0]);
        expect(filters[2]).toStrictEqual(modelRunResponse.plottingMetadata.barchart.filters[1]);
    }
});