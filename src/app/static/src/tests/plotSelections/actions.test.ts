import {
    mockAxios,
    mockCalibrateMetadataResponse,
    mockControlSelection,
    mockFilterSelection,
    mockModelCalibrateState,
    mockPlotSelections,
    mockRootState
} from "../mocks";
import {Mock, MockInstance} from "vitest";
import {actions, PlotSelectionActionUpdate, Selection} from "../../app/store/plotSelections/actions";
import * as plotSelectionsUtils from "../../app/store/plotSelections/utils";
import {PayloadWithType} from "../../app/types";
import {PlotSelectionsMutations} from "../../app/store/plotSelections/mutations";

describe("Projects actions", () => {
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
                    filter: {
                        id: "sex",
                        options: selectedOptions
                    }
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
})
;
