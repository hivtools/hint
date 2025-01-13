import {
    mockAxios,
    mockCalibrateMetadataResponse, mockComparisonPlotResponse,
    mockControlSelection,
    mockFilterSelection,
    mockModelCalibrateState,
    mockPlotSelections,
    mockRootState
} from "../mocks";
import {Mock, MockInstance} from "vitest";
import {
    actions,
    handlePlotControlOverrides,
    PlotSelectionActionUpdate,
    Selection
} from "../../src/store/plotSelections/actions";
import * as plotSelectionsUtils from "../../src/store/plotSelections/utils";
import {PayloadWithType} from "../../src/types";
import {PlotSelectionsMutations} from "../../src/store/plotSelections/mutations";
import {PlotName, PlotSelectionsState} from "../../src/store/plotSelections/plotSelections";
import {RootState} from "../../src/root";
import {PlotMetadataFrame} from "../../src/store/metadata/metadata";

describe("Projects actions", () => {
    beforeEach(() => {
        mockAxios.reset();
        // stop apiService logging to console
        console.log = vi.fn();
        vi.resetAllMocks()
    });

    afterEach(() => {
        (console.log as Mock).mockClear();
    });

    const getPlotDataMock = vi.spyOn(
        plotSelectionsUtils,
        "getPlotData"
    ).mockImplementation(vi.fn());
    const commit = vi.fn();

    it("updateSelections gets plot data and commits new selections when filter updates", async () => {
        // State setup
        const rootState = mockRootState();

        const choroplethSelections = {
            controls: [],
            filters: [mockFilterSelection({
                filterId: "sexFilterId",
                stateFilterId: "sex"
            })]
        }
        const state = mockPlotSelections({
            choropleth: choroplethSelections
        });

        // Test payload
        const selectedOptions = [
            {
                id: "male",
                label: "Male"
            },
            {
                id: "female",
                label: "Female"
            }
        ]
        const payload = {
            payload: {
                plot: "choropleth",
                selection: {
                    filters: [{
                        id: "sex",
                        options: selectedOptions
                    }]
                } as Selection
            }
        } as PayloadWithType<PlotSelectionActionUpdate>

        await actions.updateSelections({commit, state, rootState} as any, payload);

        expect(getPlotDataMock.mock.calls.length).toBe(1);
        expect(getPlotDataMock.mock.calls[0][0].plot).toBe("choropleth");

        const expectedPayload = choroplethSelections
        expectedPayload.filters[0].selection = selectedOptions
        expect(getPlotDataMock.mock.calls[0][0].selections).toStrictEqual(expectedPayload)

        expect(commit.mock.calls.length).toBe(1);
        expect(commit.mock.calls[0][0].type).toBe(PlotSelectionsMutations.updatePlotSelection);
        expect(commit.mock.calls[0][0].payload.plot).toBe("choropleth");
        expect(commit.mock.calls[0][0].payload.selections).toStrictEqual(expectedPayload);
    });

    it("updateSelections gets plot data and commits new selections with multi filter update", async () => {
        // State setup
        const rootState = mockRootState();

        const choroplethSelections = {
            controls: [],
            filters: [
                mockFilterSelection({
                    filterId: "sexFilterId",
                    stateFilterId: "sex"
                }),
                mockFilterSelection({
                    filterId: "ageFilterId",
                    stateFilterId: "age"
                })
            ]
        }
        const state = mockPlotSelections({
            choropleth: choroplethSelections
        });

        // Test payload
        const selectedSexOptions = [
            {
                id: "male",
                label: "Male"
            },
            {
                id: "female",
                label: "Female"
            }
        ];

        const selectedAgeOptions = [
            {
                id: "child",
                label: "Child"
            },
            {
                id: "adult",
                label: "Adult"
            }
        ];
        const payload = {
            payload: {
                plot: "choropleth",
                selection: {
                    filters: [
                        {
                            id: "sex",
                            options: selectedSexOptions
                        },
                        {
                            id: "age",
                            options: selectedAgeOptions
                        }
                    ]
                } as Selection
            }
        } as PayloadWithType<PlotSelectionActionUpdate>

        await actions.updateSelections({commit, state, rootState} as any, payload);

        expect(getPlotDataMock.mock.calls.length).toBe(1);
        expect(getPlotDataMock.mock.calls[0][0].plot).toBe("choropleth");

        const expectedPayload = choroplethSelections
        expectedPayload.filters[0].selection = selectedSexOptions;
        expectedPayload.filters[1].selection = selectedAgeOptions;
        expect(getPlotDataMock.mock.calls[0][0].selections).toStrictEqual(expectedPayload)

        expect(commit.mock.calls.length).toBe(1);
        expect(commit.mock.calls[0][0].type).toBe(PlotSelectionsMutations.updatePlotSelection);
        expect(commit.mock.calls[0][0].payload.plot).toBe("choropleth");
        expect(commit.mock.calls[0][0].payload.selections).toStrictEqual(expectedPayload);
    });

    it("updateSelections runs effect, gets plot data and commits new selections when control updates", async () => {
        // State setup
        const createOpts = (filterId: string) => {
            return [
                {
                    label: "Option A",
                    id: `${filterId}A`
                },
                {
                    label: "Option B",
                    id: `${filterId}B`
                }
            ]
        }
        const sexOpts = createOpts("sex");
        const ageOpts = createOpts("age");
        const calibrateResponse = mockCalibrateMetadataResponse({
            filterTypes: [
                {
                    id: "sex",
                    column_id: "sex",
                    options: sexOpts
                },
                {
                    id: "age",
                    column_id: "age",
                    options: ageOpts
                },
            ],
            plotSettingsControl: {
                choropleth: {
                    defaultEffect: {
                        setFilters: [
                            {
                                filterId: "sex",
                                label: "Sex",
                                stateFilterId: "sex"
                            },
                            {
                                filterId: "age",
                                label: "Age",
                                stateFilterId: "age"
                            },
                        ]
                    },
                    plotSettings: [
                        {
                            id: "x_axis",
                            label: "X axis",
                            options: [
                                {
                                    id: "sex",
                                    label: "Sex",
                                    effect: {
                                        setMultiple: ["sex"]
                                    }
                                },
                                {
                                    id: "age",
                                    label: "Age",
                                    effect: {
                                        setMultiple: ["age"]
                                    }
                                }
                            ]
                        }
                    ]
                },
                barchart: {
                    plotSettings: []
                },
                table: {
                    plotSettings: []
                },
                bubble: {
                    plotSettings: []
                },
                cascade: {
                    plotSettings: []
                },
            }
        });
        const rootState = mockRootState({
            modelCalibrate: mockModelCalibrateState({
                calibrateId: "id123",
                metadata: calibrateResponse
            })
        });
        const choroplethSelections = {
            controls: [
                mockControlSelection({
                    id: "x_axis",
                    label: "X axis",
                    selection: [{
                        label: "Sex",
                        id: "sex"
                    }]
                })
            ],
            filters: [
                mockFilterSelection({
                    filterId: "sex",
                    stateFilterId: "sex",
                    label: "Sex",
                    multiple: true,
                    selection: sexOpts
                }),
                mockFilterSelection({
                    filterId: "age",
                    stateFilterId: "age",
                    label: "Age",
                    multiple: false,
                    selection: [ageOpts[0]]
                })
            ]
        }
        const state = mockPlotSelections({
            choropleth: choroplethSelections
        });

        // Test payload
        const selectedOptions = [
            {
                id: "age",
                label: "Age"
            }
        ]
        const payload = {
            payload: {
                plot: "choropleth",
                selection: {
                    plotSetting: {
                        id: "x_axis",
                        options: selectedOptions
                    }
                } as Selection
            }
        } as PayloadWithType<PlotSelectionActionUpdate>

        await actions.updateSelections({commit, state, rootState} as any, payload);

        expect(getPlotDataMock.mock.calls.length).toBe(1);
        expect(getPlotDataMock.mock.calls[0][0].plot).toBe("choropleth");

        // Control has updated
        // Sex is no longer a multiselect
        // Age is a multiselect
        const expectedSelections = {
            controls: [
                mockControlSelection({
                    id: "x_axis",
                    label: "X axis",
                    selection: [{
                        label: "Age",
                        id: "age"
                    }]
                })
            ],
            filters: [
                mockFilterSelection({
                    filterId: "sex",
                    stateFilterId: "sex",
                    label: "Sex",
                    multiple: false,
                    selection: [sexOpts[0]]
                }),
                mockFilterSelection({
                    filterId: "age",
                    stateFilterId: "age",
                    label: "Age",
                    multiple: true,
                    selection: [ageOpts[1], ageOpts[0]]
                })
            ]
        }
        expect(getPlotDataMock.mock.calls[0][0].selections).toStrictEqual(expectedSelections);

        expect(commit.mock.calls.length).toBe(1);
        expect(commit.mock.calls[0][0].type).toBe(PlotSelectionsMutations.updatePlotSelection);
        expect(commit.mock.calls[0][0].payload.plot).toBe("choropleth");
        expect(commit.mock.calls[0][0].payload.selections).toStrictEqual(expectedSelections);
    });

    describe("control overrides", () => {
        const selections: PlotSelectionsState[PlotName] = {
            controls: [
                mockControlSelection({
                    id: "indicator_control",
                    label: "Indicator",
                    selection: [{
                        label: "Prevalence",
                        id: "prevalence"
                    }]
                }),
                mockControlSelection({
                    id: "x_axis",
                    label: "X axis",
                    selection: [
                        {
                            label: "Sex",
                            id: "sex"
                        }
                    ]
                })
            ],
            filters: []
        }

        const metadata: PlotMetadataFrame = {
            filterTypes: [],
            indicators: [],
            plotSettingsControl: {
                comparison: {
                    plotSettings: [{
                        id: "x_axis",
                        label: "X Axis",
                        value: "sex",
                        options: [
                            {
                                id: "sex",
                                label: "Sex",
                                effect: {
                                    setFilters: []
                                }
                            },
                            {
                                id: "age",
                                label: "Age",
                                effect: {
                                    setFilters: []
                                }
                            }
                        ]
                    }]
                }
            }
        }

        const indicatorSelection = {
            plotSetting: {
                id: "indicator_control",
                options: [
                    {
                        id: "prevalence",
                        label: "Prevalence"
                    }
                ]
            }
        }


        it("can run control overrides for comparison plot if setting indicator", () => {
            const localSelections = structuredClone(selections);
            handlePlotControlOverrides(localSelections, "comparison", indicatorSelection, metadata);

            expect(localSelections.controls.length).toBe(2);
            expect(localSelections.controls[1].id).toBe("x_axis")
            expect(localSelections.controls[1].selection.length).toBe(1);
            expect(localSelections.controls[1].selection[0].id).toBe("age")
        });

        it("doesn't run control overrides if not comparison plot", () => {
            const localSelections = structuredClone(selections);
            handlePlotControlOverrides(localSelections, "bubble", indicatorSelection, metadata);
            expect(localSelections).toStrictEqual(selections);
        });

        it("doesn't run control overrides if x-axis was updated", () => {
            const localSelections = structuredClone(selections);
            const xAxisSelection = {
                plotSetting: {
                    id: "x_axis",
                    options: [
                        {
                            id: "age",
                            label: "Age"
                        }
                    ]
                }
            }
            handlePlotControlOverrides(localSelections, "comparison", xAxisSelection, metadata);
            expect(localSelections).toStrictEqual(selections);
        });

        it("doesn't run control overrides if mapping not configured for this indicator", () => {
            const localSelections = structuredClone(selections);
            const nonMappedIndicator = {
                plotSetting: {
                    id: "indicator_control",
                    options: [
                        {
                            id: "unknown",
                            label: "Unknown"
                        }
                    ]
                }
            }
            handlePlotControlOverrides(localSelections, "comparison", nonMappedIndicator, metadata);
            expect(localSelections).toStrictEqual(selections);
        });

        it("doesn't run control overrides if can't find configured x-axis in metadata", () => {
            const localSelections = structuredClone(selections);
            const metadata: PlotMetadataFrame = {
                filterTypes: [],
                indicators: [],
                plotSettingsControl: {
                    comparison: {
                        plotSettings: []
                    }
                }
            }
            handlePlotControlOverrides(localSelections, "comparison", indicatorSelection, metadata);
            expect(localSelections).toStrictEqual(selections);
        });

        it("doesn't run control overrides if can't find x-axis in controls", () => {
            const localSelections: PlotSelectionsState[PlotName] = {
                controls: [
                    mockControlSelection({
                        id: "indicator_control",
                        label: "Indicator",
                        selection: [{
                            label: "Prevalence",
                            id: "prevalence"
                        }]
                    }),
                ],
                filters: []
            }
            const expectedSelections = structuredClone(localSelections);
            handlePlotControlOverrides(localSelections, "comparison", indicatorSelection, metadata);
            expect(localSelections).toStrictEqual(expectedSelections);
        });
    })

});
