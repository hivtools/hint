import {
    mockAxios,
    mockComparisonPlotResponse,
    mockControlSelection,
    mockFilterSelection,
    mockModelCalibrateState, mockPlotSelections,
    mockRootState
} from "../mocks";
import {actions, PlotSelectionActionUpdate, Selection} from "../../app/store/plotSelections/actions";
import {PayloadWithType} from "../../app/types";
import {PlotSelectionsMutations} from "../../app/store/plotSelections/mutations";
import {Mock, MockInstance} from "vitest";
import * as plotSelectionsUtils from "../../app/store/plotSelections/utils";

describe("plotSelections itest", () => {
    let getPlotDataMock: MockInstance;

    beforeEach(() => {
        mockAxios.reset();
        // stop apiService logging to console
        console.log = vi.fn();
        vi.resetAllMocks()
    });

    afterEach(() => {
        (console.log as Mock).mockClear();
    });

    getPlotDataMock = vi.spyOn(
        plotSelectionsUtils,
        "getPlotData"
    ).mockImplementation(vi.fn());
    const commit = vi.fn();

    it("updateSelections updated x-axis when indicator updates in comparison plot", async () => {
        // This test is an equivalent of what the current comparison plot does
        // State setup
        const createOpts = (filterIds: string[]) => {
            return filterIds.map((id: string) => {
                return {
                    label: id,
                    id: id
                }
            })
        }
        const metadata = {
            filterTypes: [
                {
                    id: "indicator",
                    column_id: "indicator",
                    options: createOpts(["prevalence", "art_coverage"])
                },
                {
                    id: "sex",
                    column_id: "sex",
                    options: createOpts(["male", "female"])
                },
                {
                    id: "age",
                    column_id: "age",
                    options: createOpts(["0-4", "5-9"])
                },
            ],
            indicators: [],
            plotSettingsControl: {
                comparison: {
                    defaultEffect: {
                        setFilters: [
                            {
                                filterId: "indicator",
                                label: "Indicator",
                                stateFilterId: "indicator"
                            },
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
                            label: "X Axis",
                            value: "sex",
                            options: [
                                {
                                    id: "sex",
                                    label: "Sex",
                                    effect: {
                                        setFilterValues: {
                                            sex: ["male", "female"],
                                            age: ["0-5"]
                                        },
                                        setMultiple: ["sex"]
                                    }
                                },
                                {
                                    id: "age",
                                    label: "Age",
                                    effect: {
                                        setFilterValues: {
                                            sex: ["female"],
                                            age: ["0-4", "5-9"]
                                        },
                                        setMultiple: ["age"]
                                    }
                                }
                            ]
                        },
                        {
                            id: "indicator_control",
                            label: "Indicator",
                            value: "prevalence",
                            options: [
                                {
                                    id: "prevalence",
                                    label: "Prevalence",
                                    effect: {
                                        setFilterValues: {
                                            indicator: ["prevalence"]
                                        }
                                    }
                                },
                                {
                                    id: "art_coverage",
                                    label: "ART coverage",
                                    effect: {
                                        setFilterValues: {
                                            indicator: ["art_coverage"]
                                        }
                                    }
                                },
                            ]
                        }
                    ]
                }
            }
        }

        const rootState = mockRootState({
            modelCalibrate: mockModelCalibrateState({
                comparisonPlotResult: mockComparisonPlotResponse({
                    metadata: metadata
                })
            })
        });
        const selections = {
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
            filters: [
                mockFilterSelection({
                    filterId: "indicator",
                    stateFilterId: "indicator",
                    label: "Indicator",
                    multiple: false,
                    selection: createOpts(["prevalence"])
                }),
                mockFilterSelection({
                    filterId: "sex",
                    stateFilterId: "sex",
                    label: "Sex",
                    multiple: true,
                    selection: createOpts(["male", "female"])
                }),
                mockFilterSelection({
                    filterId: "age",
                    stateFilterId: "age",
                    label: "Age",
                    multiple: false,
                    selection: createOpts(["0-4"])
                })
            ]
        }
        const state = mockPlotSelections({
            comparison: selections
        });

        // Test payload
        const selectedOptions = [
            {
                id: "art_coverage",
                label: "ART coverage"
            }
        ]
        const payload = {
            payload: {
                plot: "comparison",
                selection: {
                    plotSetting: {
                        id: "indicator_control",
                        options: selectedOptions
                    }
                } as Selection
            }
        } as PayloadWithType<PlotSelectionActionUpdate>

        await actions.updateSelections({commit, state, rootState} as any, payload);

        expect(getPlotDataMock.mock.calls.length).toBe(1);
        expect(getPlotDataMock.mock.calls[0][0].plot).toBe("comparison");

        // Control has updated
        // So x-axis filter has been updated too
        // and it has forced x-axis to switch to age
        // and so x-axis age effects have been run too
        // and set multiple has been set
        const expectedSelections = {
            controls: [
                mockControlSelection({
                    id: "indicator_control",
                    label: "Indicator",
                    selection: [{
                        label: "ART coverage",
                        id: "art_coverage"
                    }]
                }),
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
                    filterId: "indicator",
                    stateFilterId: "indicator",
                    label: "Indicator",
                    multiple: false,
                    selection: createOpts(["art_coverage"])
                }),
                mockFilterSelection({
                    filterId: "sex",
                    stateFilterId: "sex",
                    label: "Sex",
                    multiple: false,
                    selection: createOpts(["female"])
                }),
                mockFilterSelection({
                    filterId: "age",
                    stateFilterId: "age",
                    label: "Age",
                    multiple: true,
                    selection: createOpts(["0-4", "5-9"])
                })
            ]
        }
        expect(getPlotDataMock.mock.calls[0][0].selections).toStrictEqual(expectedSelections);

        expect(commit.mock.calls.length).toBe(1);
        expect(commit.mock.calls[0][0].type).toBe(PlotSelectionsMutations.updatePlotSelection);
        expect(commit.mock.calls[0][0].payload.plot).toBe("comparison");
        expect(commit.mock.calls[0][0].payload.selections).toStrictEqual(expectedSelections);
    });
})
