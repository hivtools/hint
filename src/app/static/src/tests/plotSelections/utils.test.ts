import {
    commitPlotDefaultSelections,
    filtersAfterUseShapeRegions,
    filtersInfoFromEffects,
    getPlotData
} from "../../app/store/plotSelections/utils";
import {PlotSelectionsMutations} from "../../app/store/plotSelections/mutations";
import * as filter from "../../app/store/plotData/filter";
import {
    getCalibrateFilteredDataset,
    getComparisonFilteredDataset,
    getOutputFilteredData,
    getTimeSeriesFilteredDataset,
    getInputChoroplethFilteredData,
    getInputComparisonFilteredData
} from "../../app/store/plotData/filter";
import {mockBaselineState, mockPlotMetadataFrame, mockRootState, mockShapeResponse} from "../mocks";
import {ShapeResponse} from "../../app/generated";
import {PlotName} from "../../app/store/plotSelections/plotSelections";

describe("Plot selections utils", () => {
    beforeEach(() => {
        vi.resetAllMocks()
    });

    const commit = vi.fn();

    const mockGetOutputFilteredData = vi
        .spyOn(filter, "getOutputFilteredData")
        .mockImplementation(async (...args) => {
            return
        });

    const mockGetTimeSeriesFilteredDataset = vi
        .spyOn(filter, "getTimeSeriesFilteredDataset")
        .mockImplementation(async (...args) => {
            return
        });

    const mockGetCalibrateFilteredDataset = vi
        .spyOn(filter, "getCalibrateFilteredDataset")
        .mockImplementation(async (...args) => {
            return
        });

    const mockGetComparisonFilteredDataset = vi
        .spyOn(filter, "getComparisonFilteredDataset")
        .mockImplementation(async (...args) => {
            return
        });

    const mockGetInputChoroplethFilteredData = vi
        .spyOn(filter, "getInputChoroplethFilteredData")
        .mockImplementation(async (...args) => {
            return
        });

    const mockGetInputComparisonFilteredData = vi
        .spyOn(filter, "getInputComparisonFilteredData")
        .mockImplementation(async (...args) => {
            return
        });

    const mockGetPopulationFilteredData = vi
        .spyOn(filter, "getPopulationFilteredData")
        .mockImplementation(async (...args) => {
            return
        });
    
    const rootState = mockRootState();

    const rootGetters = {};

    it("filtersAfterUseShapeRegions works as expected", () => {
        const filters = [
            {id: "area", options: null, use_shape_regions: true},
            {id: "other", options: []}
        ];
        const rootState = {
            baseline: {
                shape: {
                    filters: {
                        regions: {id: "testRegions"}
                    }
                }
            }
        };
        expect(filtersAfterUseShapeRegions(filters as any, rootState as any))
            .toStrictEqual([
                {id: "area", options: [{id: "testRegions"}]},
                {id: "other", options: []}
            ]);
    });

    it("commitPlotDefaultSelections fetches plot data and commits plot selections when no controls or filters", async () => {
        const metadata = mockPlotMetadataFrame();
        await commitPlotDefaultSelections(metadata, commit, rootState, rootGetters);

        expect(mockGetOutputFilteredData.mock.calls.length).toBe(1);

        expect(commit.mock.calls.length).toBe(1);
        expect(commit.mock.calls[0][0]).toBe(`plotSelections/${PlotSelectionsMutations.updatePlotSelection}`);
        expect(commit.mock.calls[0][1].payload).toStrictEqual({
            plot: "choropleth",
            selections: {
                controls: [],
                filters: []
            }
        });
    })

    it("commitPlotDefaultSelections runs default effect", async () => {
        const metadata = mockPlotMetadataFrame({
            filterTypes: [
                {
                    id: "choroplethFilterId",
                    column_id: "1",
                    options: [
                        {
                            id: "op1",
                            label: "lab1"
                        }
                    ]
                },
                {
                    id: "barchartFilterId",
                    column_id: "1",
                    options: [
                        {
                            id: "op1",
                            label: "lab1"
                        }
                    ]
                }
            ],
            plotSettingsControl: {
                choropleth: {
                    defaultEffect: {
                        setFilters: [
                            {
                                filterId: "choroplethFilterId",
                                label: "Filter",
                                stateFilterId: "stateFilterId"
                            }
                        ]
                    },
                    plotSettings: []
                },
                barchart: {
                    defaultEffect: {
                        setFilters: [
                            {
                                filterId: "barchartFilterId",
                                label: "Filter",
                                stateFilterId: "stateFilterId"
                            }
                        ]
                    },
                    plotSettings: []
                }
            },
        });
        await commitPlotDefaultSelections(metadata, commit, rootState, rootGetters)

        expect(commit.mock.calls.length).toBe(2)
        expect(commit.mock.calls[0][0]).toBe(`plotSelections/${PlotSelectionsMutations.updatePlotSelection}`)
        expect(commit.mock.calls[0][1].payload).toStrictEqual({
            plot: "choropleth",
            selections: {
                controls: [],
                filters: [{
                    filterId: "choroplethFilterId",
                    hidden: false,
                    label: "Filter",
                    multiple: false,
                    selection: [{
                        id: "op1",
                        label: "lab1"
                    }],
                    stateFilterId: "stateFilterId"
                }]
            }
        })

        expect(commit.mock.calls[1][0]).toBe(`plotSelections/${PlotSelectionsMutations.updatePlotSelection}`)
        expect(commit.mock.calls[1][1].payload).toStrictEqual({
            plot: "barchart",
            selections: {
                controls: [],
                filters: [{
                    filterId: "barchartFilterId",
                    hidden: false,
                    label: "Filter",
                    multiple: false,
                    selection: [{
                        id: "op1",
                        label: "lab1"
                    }],
                    stateFilterId: "stateFilterId"
                }]
            }
        })
    });

    it("commitPlotDefaultSelections runs effect for initial plot setting", async () => {
        const metadata = mockPlotMetadataFrame({
            filterTypes: [
                {
                    id: "choroplethFilterId",
                    column_id: "1",
                    options: [
                        {
                            id: "op1",
                            label: "lab1"
                        }
                    ]
                },
                {
                    id: "anotherFilterId",
                    column_id: "1",
                    options: [
                        {
                            id: "op1",
                            label: "lab1"
                        }
                    ]
                }
            ],
            plotSettingsControl: {
                choropleth: {
                    plotSettings: [{
                        id: "preset",
                        label: "Preset",
                        options: [
                            {
                                id: "preset1",
                                label: "Preset 1",
                                effect: {
                                    setFilters: [
                                        {
                                            filterId: "choroplethFilterId",
                                            label: "Filter",
                                            stateFilterId: "stateFilterId"
                                        }
                                    ]
                                }
                            },
                            {
                                id: "preset2",
                                label: "Preset 2",
                                effect: {
                                    setFilters: [
                                        {
                                            filterId: "anotherFilterId",
                                            label: "Filter",
                                            stateFilterId: "stateFilterId"
                                        }
                                    ]
                                }
                            }
                        ]
                    }]
                }
            }
        });
        await commitPlotDefaultSelections(metadata, commit, rootState, rootGetters);

        expect(mockGetOutputFilteredData.mock.calls.length).toBe(1);

        expect(commit.mock.calls.length).toBe(1);
        expect(commit.mock.calls[0][0]).toBe(`plotSelections/${PlotSelectionsMutations.updatePlotSelection}`);
        expect(commit.mock.calls[0][1].payload.selections.controls).toStrictEqual([{
            id: "preset",
            label: "Preset",
            selection: [{
                id: "preset1",
                label: "Preset 1"
            }]
        }]);
    });


    it("commitPlotDefaultSelections uses value for plotSetting if it exists", async () => {
        const metadata = mockPlotMetadataFrame({
            filterTypes: [
                {
                    id: "choroplethFilterId",
                    column_id: "1",
                    options: [
                        {
                            id: "op1",
                            label: "lab1"
                        }
                    ]
                },
                {
                    id: "anotherFilterId",
                    column_id: "1",
                    options: [
                        {
                            id: "op1",
                            label: "lab1"
                        }
                    ]
                }
            ],
            plotSettingsControl: {
                choropleth: {
                    plotSettings: [{
                        id: "preset",
                        label: "Preset",
                        value: "preset2",
                        options: [
                            {
                                id: "preset1",
                                label: "Preset 1",
                                effect: {
                                    setFilters: [
                                        {
                                            filterId: "choroplethFilterId",
                                            label: "Filter",
                                            stateFilterId: "stateFilterId"
                                        }
                                    ]
                                }
                            },
                            {
                                id: "preset2",
                                label: "Preset 2",
                                effect: {
                                    setFilters: [
                                        {
                                            filterId: "anotherFilterId",
                                            label: "Filter",
                                            stateFilterId: "stateFilterId"
                                        }
                                    ]
                                }
                            }
                        ]
                    }]
                }
            }
        });
        const rootState = mockRootState();
        await commitPlotDefaultSelections(metadata, commit, rootState, rootGetters);

        expect(mockGetOutputFilteredData.mock.calls.length).toBe(1);

        expect(commit.mock.calls.length).toBe(1);
        expect(commit.mock.calls[0][0]).toBe(`plotSelections/${PlotSelectionsMutations.updatePlotSelection}`);
        expect(commit.mock.calls[0][1].payload.selections.controls).toStrictEqual([{
            id: "preset",
            label: "Preset",
            selection: [{
                id: "preset2",
                label: "Preset 2"
            }]
        }]);
    });

    it("gets appropriate plot data depending on plot name", async () => {
        await getPlotData({plot: "choropleth", selections: {controls: [], filters: []}}, commit, rootState, rootGetters);

        expect(mockGetOutputFilteredData.mock.calls.length).toBe(1);
        expect(mockGetTimeSeriesFilteredDataset.mock.calls.length).toBe(0);
        expect(mockGetCalibrateFilteredDataset.mock.calls.length).toBe(0);
        expect(mockGetComparisonFilteredDataset.mock.calls.length).toBe(0);
        expect(mockGetInputChoroplethFilteredData.mock.calls.length).toBe(0);
        expect(mockGetInputComparisonFilteredData.mock.calls.length).toBe(0);
        expect(mockGetPopulationFilteredData.mock.calls.length).toBe(0);

        await getPlotData({plot: "timeSeries", selections: {controls: [], filters: []}}, commit, rootState, rootGetters);

        expect(mockGetOutputFilteredData.mock.calls.length).toBe(1);
        expect(mockGetTimeSeriesFilteredDataset.mock.calls.length).toBe(1);
        expect(mockGetCalibrateFilteredDataset.mock.calls.length).toBe(0);
        expect(mockGetComparisonFilteredDataset.mock.calls.length).toBe(0);
        expect(mockGetInputChoroplethFilteredData.mock.calls.length).toBe(0);
        expect(mockGetInputComparisonFilteredData.mock.calls.length).toBe(0);
        expect(mockGetPopulationFilteredData.mock.calls.length).toBe(0);

        await getPlotData({plot: "calibrate", selections: {controls: [], filters: []}}, commit, rootState, rootGetters);

        expect(mockGetOutputFilteredData.mock.calls.length).toBe(1);
        expect(mockGetTimeSeriesFilteredDataset.mock.calls.length).toBe(1);
        expect(mockGetCalibrateFilteredDataset.mock.calls.length).toBe(1);
        expect(mockGetComparisonFilteredDataset.mock.calls.length).toBe(0);
        expect(mockGetInputComparisonFilteredData.mock.calls.length).toBe(0);
        expect(mockGetPopulationFilteredData.mock.calls.length).toBe(0);

        await getPlotData({plot: "comparison", selections: {controls: [], filters: []}}, commit, rootState, rootGetters);

        expect(mockGetOutputFilteredData.mock.calls.length).toBe(1);
        expect(mockGetTimeSeriesFilteredDataset.mock.calls.length).toBe(1);
        expect(mockGetCalibrateFilteredDataset.mock.calls.length).toBe(1);
        expect(mockGetComparisonFilteredDataset.mock.calls.length).toBe(1);
        expect(mockGetInputChoroplethFilteredData.mock.calls.length).toBe(0);
        expect(mockGetInputComparisonFilteredData.mock.calls.length).toBe(0);
        expect(mockGetPopulationFilteredData.mock.calls.length).toBe(0);

        await getPlotData({plot: "inputChoropleth", selections: {controls: [], filters: []}}, commit, rootState, rootGetters);

        expect(mockGetOutputFilteredData.mock.calls.length).toBe(1);
        expect(mockGetTimeSeriesFilteredDataset.mock.calls.length).toBe(1);
        expect(mockGetCalibrateFilteredDataset.mock.calls.length).toBe(1);
        expect(mockGetComparisonFilteredDataset.mock.calls.length).toBe(1);
        expect(mockGetInputChoroplethFilteredData.mock.calls.length).toBe(1);
        expect(mockGetInputComparisonFilteredData.mock.calls.length).toBe(0);
        expect(mockGetPopulationFilteredData.mock.calls.length).toBe(0);

        await getPlotData({
            plot: "inputComparisonBarchart",
            selections: {controls: [], filters: []}
        }, commit, rootState, rootGetters);

        expect(mockGetOutputFilteredData.mock.calls.length).toBe(1);
        expect(mockGetTimeSeriesFilteredDataset.mock.calls.length).toBe(1);
        expect(mockGetCalibrateFilteredDataset.mock.calls.length).toBe(1);
        expect(mockGetComparisonFilteredDataset.mock.calls.length).toBe(1);
        expect(mockGetInputChoroplethFilteredData.mock.calls.length).toBe(1);
        expect(mockGetInputComparisonFilteredData.mock.calls.length).toBe(1);
        expect(mockGetPopulationFilteredData.mock.calls.length).toBe(0);

        await getPlotData({
            plot: "population",
            selections: {controls: [], filters: []}
        }, commit, rootState, rootGetters);

        expect(mockGetOutputFilteredData.mock.calls.length).toBe(1);
        expect(mockGetTimeSeriesFilteredDataset.mock.calls.length).toBe(1);
        expect(mockGetCalibrateFilteredDataset.mock.calls.length).toBe(1);
        expect(mockGetComparisonFilteredDataset.mock.calls.length).toBe(1);
        expect(mockGetInputChoroplethFilteredData.mock.calls.length).toBe(1);
        expect(mockGetInputComparisonFilteredData.mock.calls.length).toBe(1);
        expect(mockGetPopulationFilteredData.mock.calls.length).toBe(1);

        await expect(getPlotData({
            plot: ("unknown" as PlotName),
            selections: {controls: [], filters: []}
        }, commit, rootState, rootGetters)).rejects.toThrowError(
            new Error("Unreachable, if seeing this you're missing clause for filtering a type of plot data."))
    });

    it("filtersInfoFromEffects runs setFilters effect correctly", async () => {
        const metadata = mockPlotMetadataFrame();
        const effects = [{
            setFilters: [
                {
                    filterId: "filterType1",
                    label: "Filter 1",
                    stateFilterId: "stateFilterId1"
                },
                {
                    filterId: "filterType2",
                    label: "Filter 2",
                    stateFilterId: "stateFilterId2"
                }
            ]
        }];

        const update = filtersInfoFromEffects(effects, rootState, metadata);

        expect(update).toStrictEqual([
            {
                filterId: "filterType1",
                label: "Filter 1",
                stateFilterId: "stateFilterId1",
                selection: [{
                    id: "op1",
                    label: "lab1"
                }],
                multiple: false,
                hidden: false
            }, {
                filterId: "filterType2",
                label: "Filter 2",
                stateFilterId: "stateFilterId2",
                selection: [{
                    id: "op2",
                    label: "lab2"
                }],
                multiple: false,
                hidden: false
            }
        ]);
    });

    it("filtersInfoFromEffects runs setMultiple effect correctly", async () => {
        const metadata = mockPlotMetadataFrame();
        const effects = [{
            setFilters: [
                {
                    filterId: "filterType1",
                    label: "Filter 1",
                    stateFilterId: "stateFilterId1"
                }
            ],
            setMultiple: ["stateFilterId1"]
        }];

        const update = filtersInfoFromEffects(effects, rootState, metadata);

        expect(update).toStrictEqual([
            {
                filterId: "filterType1",
                label: "Filter 1",
                stateFilterId: "stateFilterId1",
                selection: [
                    {
                        id: "op2",
                        label: "lab2"
                    },
                    {
                        id: "op1",
                        label: "lab1"
                    }
                ],
                multiple: true,
                hidden: false
            }
        ]);
    });

    it("filtersInfoFromEffects runs setFilterValues effect correctly", async () => {
        const metadata = mockPlotMetadataFrame();
        const effects = [{
            setFilters: [
                {
                    filterId: "filterType1",
                    label: "Filter 1",
                    stateFilterId: "stateFilterId1"
                }
            ],
            setFilterValues: {
                "stateFilterId1": ["op2"]
            }
        }];

        const update = filtersInfoFromEffects(effects, rootState, metadata);

        expect(update).toStrictEqual([
            {
                filterId: "filterType1",
                label: "Filter 1",
                stateFilterId: "stateFilterId1",
                selection: [
                    {
                        id: "op2",
                        label: "lab2"
                    }
                ],
                multiple: false,
                hidden: false
            }
        ]);
    });

    it("filtersInfoFromEffects runs setHidden effect correctly", async () => {
        const metadata = mockPlotMetadataFrame();
        const effects = [{
            setFilters: [
                {
                    filterId: "filterType1",
                    label: "Filter 1",
                    stateFilterId: "stateFilterId1"
                }
            ],
            setHidden: ["stateFilterId1"]
        }];

        const update = filtersInfoFromEffects(effects, rootState, metadata);

        expect(update).toStrictEqual([
            {
                filterId: "filterType1",
                label: "Filter 1",
                stateFilterId: "stateFilterId1",
                selection: [
                    {
                        id: "op1",
                        label: "lab1"
                    }
                ],
                multiple: false,
                hidden: true
            }
        ]);
    });

    it("filtersInfoFromEffects can run with multiple effects", async () => {
        const metadata = mockPlotMetadataFrame();
        const effects = [
            {
                setFilters: [
                    {
                        filterId: "filterType1",
                        label: "Filter 1",
                        stateFilterId: "stateFilterId1"
                    }
                ],
            },
            {
                setHidden: ["stateFilterId1"]
            }
        ];

        const update = filtersInfoFromEffects(effects, rootState, metadata);

        expect(update).toStrictEqual([
            {
                filterId: "filterType1",
                label: "Filter 1",
                stateFilterId: "stateFilterId1",
                selection: [
                    {
                        id: "op1",
                        label: "lab1"
                    }
                ],
                multiple: false,
                hidden: true
            }
        ]);
    });

    it("filtersInfoFromEffects selects all nested filters for area if using multiselect", async () => {
        const metadata = mockPlotMetadataFrame({
            filterTypes: [
                {
                    id: "area",
                    column_id: "1",
                    options: [],
                    use_shape_regions: true
                }
            ]
        });
        const northernNestedChild = {id: "MWI_1_1_1", lab: "Northern1A"};
        const northernChild = {
            id: "MWI_1_1",
            lab: "Northern1",
            children: [northernNestedChild]
        };
        const northernOption = {
            id: "MWI_1",
            label: "Northern",
            children: [northernChild]
        };
        const centralChild = {id: "MWI_2_1", lab: "Central1"};
        const centralOption = {
            id: "MWI_2",
            label: "Central",
            children: [centralChild]
        }
        const countryOption: ShapeResponse["filters"]["regions"] = {
            label: "Malawi",
            id: "mwi",
            children: [
                northernOption,
                centralOption
            ]
        };
        const rootState = mockRootState({
            baseline: mockBaselineState({
                shape: mockShapeResponse({
                    filters: {
                        level_labels: [
                            {id: 1, area_level_label: "Country", display: true},
                            {id: 2, area_level_label: "Region", display: true},
                            {id: 3, area_level_label: "District", display: true}
                        ],
                        regions: countryOption
                    }
                })
            })
        });
        const effects = [{
            setFilters: [
                {
                    filterId: "area",
                    label: "Area",
                    stateFilterId: "area"
                }
            ],
            setMultiple: ["area"]
        }];

        const update = filtersInfoFromEffects(effects, rootState, metadata);

        expect(update).toStrictEqual([
            {
                filterId: "area",
                label: "Area",
                stateFilterId: "area",
                selection: [countryOption, centralOption, centralChild, northernOption, northernChild, northernNestedChild],
                multiple: true,
                hidden: false
            }
        ]);
    });
});
