import {modelOutputGetters} from "../../app/store/modelOutput/modelOutput";
import {
    mockBaselineState, mockCalibrateResultResponse, mockModelCalibrateState, mockModelOutputState,
    mockRootState, mockComparisonPlotResponse,
    mockShapeResponse, mockCalibrateMetadataResponse
} from "../mocks";
import {Filter} from "../../app/types";


describe("modelOutput module", () => {

    const filters = [
        {id: "age", column_id: "age_group_id", label: "Age", options: []},
        {id: "quarter", column_id: "quarter_id", label: "Quarter", options: []},
        {id: "area", column_id: "area_id", label: "Area", options: [], use_shape_regions: true},
    ];

    const modelCalibrateMetadataResponse = mockCalibrateMetadataResponse({
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

        },
        tableMetadata: {
            presets: [
                {
                    defaults: {
                        column: {
                            id: "age_group_id",
                            label: "Age group"
                        },
                        id: "preset_id",
                        row: {
                            id: "quarter_id",
                            label: "Quarter"
                        },
                        label: "Preset ID"
                    },
                    filters
                }
            ]
        }
    });

    const comparisonPlotResponse = mockComparisonPlotResponse({
        plottingMetadata: {
            barchart: {
                selections: [{
                    disaggregate_by_id: "source",
                    indicator_id: "art_coverage",
                    selected_filter_options : {},
                    x_axis_id:"age"
                }],
                defaults: {} as any,
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
        modelCalibrate: mockModelCalibrateState({
            metadata: modelCalibrateMetadataResponse,
            comparisonPlotResult: comparisonPlotResponse
        }),
        plottingSelections: {
            table: {
                indicator: "",
                preset: "preset_id",
                selectedFilterOptions: {}
            }
        } as any
    });

    it("gets barchart indicators", async () => {
        const result = modelOutputGetters.barchartIndicators(mockModelOutputState(), null, rootState);
        expect(result.length).toEqual(2);
        expect(result).toBe(modelCalibrateMetadataResponse.plottingMetadata.barchart.indicators);
    });


    it("gets barchart filters", async () => {
        const result = modelOutputGetters.barchartFilters(mockModelOutputState(), null, rootState);
        expectOutputPlotFilters(result);
    });

    it("gets comparison plot indicators", async () => {
        const result = modelOutputGetters.comparisonPlotIndicators(mockModelOutputState(), null, rootState);
        expect(result.length).toEqual(2);
        expect(result).toBe(comparisonPlotResponse.plottingMetadata.barchart.indicators);
    });


    it("gets comparison plot filters", async () => {
        const result = modelOutputGetters.comparisonPlotFilters(mockModelOutputState(), null, rootState);
        expectOutputPlotFilters(result);
    });

    it("gets bubble plot indicators", async () => {
        const result = modelOutputGetters.bubblePlotIndicators(mockModelOutputState(), null, rootState);
        expect(result).toBe(modelCalibrateMetadataResponse.plottingMetadata.choropleth.indicators);
    });

    it("gets bubble plot filters", async () => {
        const result = modelOutputGetters.bubblePlotFilters(mockModelOutputState(), null, rootState);
        expectOutputPlotFilters(result);
    });

    it("gets choropleth indicators", async () => {
        const result = modelOutputGetters.choroplethIndicators(mockModelOutputState(), null, rootState);
        expect(result).toBe(modelCalibrateMetadataResponse.plottingMetadata.choropleth.indicators);
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

    it("gets table filters", () => {
        const result = modelOutputGetters.tableFilters(mockModelOutputState(), null, rootState, null);
        expect(result.length).toEqual(3);
        expect(result[0]).toStrictEqual({
            id: "area",
            column_id: "area_id",
            label: "Area",
            use_shape_regions: true,
            allowMultiple: false,
            options: [{
                id: "id1",
                label: "label 1",
                children: [{id: "child1", label: "child label 1"}]
            }]
        });
        expect(result[1]).toStrictEqual({
            id: "age",
            column_id: "age_group_id",
            label: "Age",
            allowMultiple: true,
            options: []
        });
        expect(result[2]).toStrictEqual({
            id: "quarter",
            column_id: "quarter_id",
            label: "Quarter",
            allowMultiple: true,
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

    it("gets default comparison barchart selections", async () => {
        const result = modelOutputGetters.comparisonPlotDefaultSelections(mockModelOutputState(), null, rootState);
        expect(result.length).toEqual(1);
        expect(result).toBe(comparisonPlotResponse.plottingMetadata.barchart.selections);
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
        expect(filters[1]).toStrictEqual(modelCalibrateMetadataResponse.plottingMetadata.barchart.filters[0]);
        expect(filters[2]).toStrictEqual(modelCalibrateMetadataResponse.plottingMetadata.barchart.filters[1]);
    }
});