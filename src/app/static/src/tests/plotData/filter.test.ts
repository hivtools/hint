import {
    mockAncResponse,
    mockAxios,
    mockCalibrateDataResponse,
    mockCalibrateMetadataResponse,
    mockCalibratePlotResponse,
    mockComparisonPlotResponse,
    mockControlSelection,
    mockFailure,
    mockFilterSelection,
    mockGenericChartDataset,
    mockMetadataState,
    mockModelCalibrateState,
    mockReviewInputMetadata,
    mockRootState,
    mockSuccess,
    mockSurveyAndProgramState
} from "../mocks";
import {
    getCalibrateFilteredDataset,
    getComparisonFilteredDataset,
    getInputChoroplethFilteredData,
    getOutputFilteredData,
    getTimeSeriesFilteredDataset
} from "../../app/store/plotData/filter";
import {PlotDataMutations, PlotDataUpdate} from "../../app/store/plotData/mutations";
import {PlotSelectionUpdate} from "../../app/store/plotSelections/mutations";
import {GenericChartMutation} from "../../app/store/genericChart/mutations";
import {CommitOptions} from "vuex";
import {
    AncDataRow,
    CalibratePlotResponse,
    ComparisonPlotRow,
    ReviewInputFilterMetadataResponse
} from "../../app/generated";
import {FilterSelection} from "../../app/store/plotSelections/plotSelections";
import {Mock} from "vitest";

describe("filter tests", () => {

    beforeEach(() => {
        // stop apiService logging to console
        console.log = vi.fn();
        mockAxios.reset()
        vi.resetAllMocks()
    });

    afterEach(() => {
        (console.log as Mock).mockClear();
    });

    describe("getOutputFilteredData works as expected", () => {
        const commit = vi.fn();

        const options = [
            {
                label: "Option A",
                id: "detailOptA"
            },
            {
                label: "Option B",
                id: "detailOptB"
            },
            {
                label: "Option C",
                id: "detailOptC"
            }
        ]
        const calibrateResponse = mockCalibrateMetadataResponse({
            filterTypes: [
                {
                    id: "filter1",
                    column_id: "column1",
                    options: options
                },
                {
                    id: "filter2",
                    column_id: "column2",
                    options: options
                },
            ]
        });

        const selections: PlotSelectionUpdate["selections"]["filters"] = [mockFilterSelection({
            filterId: "filter1",
            selection: options.slice(1, 3) // get 2nd and 3rd entries
        })];

        const rootState = mockRootState({
            modelCalibrate: mockModelCalibrateState({
                calibrateId: "id123",
                metadata: calibrateResponse
            })
        });

        const mockData = mockCalibrateDataResponse()

        it("can get output filtered data", async () => {
            mockAxios.onPost(`/calibrate/result/filteredData/id123`)
                .reply(200, mockSuccess(mockData));

            await getOutputFilteredData("choropleth", selections, {commit, rootState});

            expect(mockAxios.history.post.length).toBe(1);
            expect(mockAxios.history.post[0].data).toStrictEqual('{"column1":["detailOptB","detailOptC"]}');

            expect(commit.mock.calls.length).toBe(1);
            const expectedPayload = {
                plot: "choropleth",
                data: mockData
            } as PlotDataUpdate
            expect(commit.mock.calls[0][0]).toStrictEqual(`plotData/${PlotDataMutations.updatePlotData}`);
            expect(commit.mock.calls[0][1]).toStrictEqual({
                payload: expectedPayload
            });
            expect(commit.mock.calls[0][2]).toStrictEqual({root: true});
        });

        it("multiple filters on same column get appended", async () => {
            mockAxios.onPost(`/calibrate/result/filteredData/id123`)
                .reply(200, mockSuccess(mockData));

            const selections: PlotSelectionUpdate["selections"]["filters"] = [
                mockFilterSelection({
                    filterId: "filter1",
                    selection: [options[1]]
                }),
                mockFilterSelection({
                    filterId: "filter1",
                    selection: [options[2]]
                })
            ];

            await getOutputFilteredData("choropleth", selections, {commit, rootState});

            expect(mockAxios.history.post.length).toBe(1);
            expect(mockAxios.history.post[0].data).toStrictEqual('{"column1":["detailOptB","detailOptC"]}');

            expect(commit.mock.calls.length).toBe(1);
            const expectedPayload = {
                plot: "choropleth",
                data: mockData
            } as PlotDataUpdate
            expect(commit.mock.calls[0][0]).toStrictEqual(`plotData/${PlotDataMutations.updatePlotData}`);
            expect(commit.mock.calls[0][1]).toStrictEqual({
                payload: expectedPayload
            });
            expect(commit.mock.calls[0][2]).toStrictEqual({root: true});
        });

        it("handles case when selection is not in filter types", async () => {
            mockAxios.onPost(`/calibrate/result/filteredData/id123`)
                .reply(200, mockSuccess(mockData));

            const calibrateResponse = mockCalibrateMetadataResponse({
                filterTypes: [
                    {
                        id: "filter2",
                        column_id: "column2",
                        options: options
                    },
                ]
            });
            const rootState = mockRootState({
                modelCalibrate: mockModelCalibrateState({
                    calibrateId: "id123",
                    metadata: calibrateResponse
                })
            });

            await getOutputFilteredData("choropleth", selections, {commit, rootState});

            expect(mockAxios.history.post.length).toBe(1);
            expect(mockAxios.history.post[0].data).toStrictEqual('{}');

            expect(commit.mock.calls.length).toBe(1);
            const expectedPayload = {
                plot: "choropleth",
                data: mockData
            } as PlotDataUpdate
            expect(commit.mock.calls[0][0]).toStrictEqual(`plotData/${PlotDataMutations.updatePlotData}`);
            expect(commit.mock.calls[0][1]).toStrictEqual({
                payload: expectedPayload
            });
            expect(commit.mock.calls[0][2]).toStrictEqual({root: true});
        });

        it("commits error if fetch fails", async () => {
            mockAxios.onPost(`/calibrate/result/filteredData/id123`)
                .reply(400, mockFailure("failed"));

            await getOutputFilteredData("choropleth", selections, {commit, rootState});

            expect(mockAxios.history.post.length).toBe(1);
            expect(mockAxios.history.post[0].data).toStrictEqual('{"column1":["detailOptB","detailOptC"]}');

            expect(commit.mock.calls.length).toBe(1);
            expect(commit.mock.calls[0][0].type).toStrictEqual("setError");
        });
    });

    describe("getTimeSeriesFilteredDataset works as expected", () => {

        const createPayload = (filterSelections = [{label: "Option B", id: "opt2"}]) => ({
            plot: "timeSeries",
            selections: {
                controls: [mockControlSelection({
                    id: "time_series_data_source",
                    selection: [
                        {label: "ANC", id: "anc"},
                        {label: "ART", id: "art"}
                    ],
                })],
                filters: [mockFilterSelection({
                    filterId: "time_series_data_source",
                    stateFilterId: "time_series_data_source",
                    label: "Data source filter",
                    multiple: false,
                    selection: filterSelections,
                })],
            }
        } as PlotSelectionUpdate);

        const createMockRootState = (filterTypes: ReviewInputFilterMetadataResponse["filterTypes"] = []) => mockRootState({
            metadata: mockMetadataState({
                reviewInputMetadata: mockReviewInputMetadata({filterTypes})
            })
        });

        // getTimeSeriesFilteredDataset fetches data, commits it to store, then filters the
        // data from the store. So we have to make sure that we mock our commit
        const createMockCommit = (rootState: any) => vi.fn((type: string, payload?: any, options?: CommitOptions) => {
            // Simulate the Vuex mutation behavior by manually modifying rootState
            if (type === `genericChart/${GenericChartMutation.SetDataset}` && options?.root) {
                rootState.genericChart.datasets[payload.payload.datasetId] = payload.payload.dataset;
            }
        });

        const mockData = [
            {
                "data_source": "opt1",
                "value": 1
            },
            {
                "data_source": "opt2",
                "value": 2
            },
        ]
        const mockTimeSeriesData = mockGenericChartDataset({
            data: mockData
        });

        it("fetches data if it doesn't exist and commits filtered data to store", async () => {
            mockAxios.onGet(`/chart-data/input-time-series/anc`)
                .reply(200, mockSuccess(mockTimeSeriesData));

            const rootState = createMockRootState([
                {
                    id: "time_series_data_source",
                    column_id: "data_source",
                    options: [
                        {id: "opt1", label: "lab1"},
                        {id: "opt2", label: "lab1"}
                    ]
                }
            ]);

            const commit = createMockCommit(rootState);
            const payload = createPayload();

            await getTimeSeriesFilteredDataset(payload, commit, rootState);

            expect(commit.mock.calls.length).toBe(4);
            expect(commit.mock.calls[0][0]).toStrictEqual(`genericChart/${GenericChartMutation.SetError}`);
            expect(commit.mock.calls[1][0]).toStrictEqual(`genericChart/${GenericChartMutation.SetDataset}`);
            expect(commit.mock.calls[1][1].payload).toStrictEqual({
                datasetId: "anc",
                dataset: mockTimeSeriesData
            });
            expect(commit.mock.calls[2][0]).toStrictEqual(`genericChart/${GenericChartMutation.WarningsFetched}`);
            expect(commit.mock.calls[2][1].payload).toStrictEqual(mockTimeSeriesData.warnings);
            const expectedPayload = {
                plot: "timeSeries",
                data: [
                    {
                        "data_source": "opt2",
                        "value": 2
                    },
                ]
            };
            expect(commit.mock.calls[3][0]).toStrictEqual(`plotData/${PlotDataMutations.updatePlotData}`);
            expect(commit.mock.calls[3][1].payload).toStrictEqual(expectedPayload);

            // Data is not fetched again on subsequent calls, but filtering is updated
            const payload2 = createPayload([
                {
                    label: "Option A",
                    id: "opt1"
                },
            ]);

            await getTimeSeriesFilteredDataset(payload2, commit, rootState);

            expect(commit.mock.calls.length).toBe(6);
            const expectedPayload2 = {
                plot: "timeSeries",
                data: [
                    {
                        "data_source": "opt1",
                        "value": 1
                    },
                ]
            };
            expect(commit.mock.calls[4][0]).toStrictEqual(`genericChart/${GenericChartMutation.SetError}`);
            expect(commit.mock.calls[5][0]).toStrictEqual(`plotData/${PlotDataMutations.updatePlotData}`);
            expect(commit.mock.calls[5][1].payload).toStrictEqual(expectedPayload2);
        });

        it("sets error if data fetch fails", async () => {
            const commit = vi.fn();
            const rootState = mockRootState();
            mockAxios.onGet(`/chart-data/input-time-series/anc`)
                .reply(400, mockFailure("failed"));

            const payload = createPayload();
            await getTimeSeriesFilteredDataset(payload, commit, rootState);

            expect(commit.mock.calls.length).toBe(2);
            expect(commit.mock.calls[0][0]).toStrictEqual(`genericChart/${GenericChartMutation.SetError}`);
            expect(commit.mock.calls[0][1]).toStrictEqual({payload: null});
            expect(commit.mock.calls[1][0]).toStrictEqual({
                type: `${GenericChartMutation.SetError}`,
                payload: {
                    detail: "failed",
                    error: "OTHER_ERROR"
                }
            });
        });

        it("converts type when filtering on area level", async () => {
            const mockData = [
                {
                    "data_source": "opt1",
                    "area_level": 1,
                    "value": 1
                },
                {
                    "data_source": "opt1",
                    "area_level": 2,
                    "value": 1
                },
                {
                    "data_source": "opt2",
                    "area_level": 1,
                    "value": 2
                },
                {
                    "data_source": "opt2",
                    "area_level": 2,
                    "value": 2
                },
            ]
            const mockTimeSeriesData = mockGenericChartDataset({
                data: mockData
            });

            mockAxios.onGet(`/chart-data/input-time-series/anc`)
                .reply(200, mockSuccess(mockTimeSeriesData));

            const rootState = createMockRootState([
                {
                    id: "time_series_data_source",
                    column_id: "data_source",
                    options: [
                        {
                            id: "opt1",
                            label: "lab1"
                        },
                        {
                            id: "opt2",
                            label: "lab1"
                        }
                    ]
                },
                {
                    id: "area_level",
                    column_id: "area_level",
                    options: [
                        {
                            id: "1",
                            label: "Area 1"
                        },
                        {
                            id: "2",
                            label: "Area 2"
                        }
                    ]
                }
            ]);

            const payload = createPayload()
            payload.selections.filters.push(mockFilterSelection({
                filterId: "area_level",
                stateFilterId: "area_level",
                label: "Area level filter",
                selection: [
                    {
                        label: "Area",
                        id: "1"
                    }
                ],
            }))

            const commit = createMockCommit(rootState);

            await getTimeSeriesFilteredDataset(payload, commit, rootState);

            expect(commit.mock.calls.length).toBe(4);
            expect(commit.mock.calls[0][0]).toStrictEqual(`genericChart/${GenericChartMutation.SetError}`);
            expect(commit.mock.calls[1][0]).toStrictEqual(`genericChart/${GenericChartMutation.SetDataset}`);
            expect(commit.mock.calls[1][1].payload).toStrictEqual({
                datasetId: "anc",
                dataset: mockTimeSeriesData
            });
            expect(commit.mock.calls[2][0]).toStrictEqual(`genericChart/${GenericChartMutation.WarningsFetched}`);
            expect(commit.mock.calls[2][1].payload).toStrictEqual(mockTimeSeriesData.warnings);
            const expectedPayload = {
                plot: "timeSeries",
                data: [
                    {
                        "data_source": "opt2",
                        "area_level": 1,
                        "value": 2
                    },
                ]
            };
            expect(commit.mock.calls[3][0]).toStrictEqual(`plotData/${PlotDataMutations.updatePlotData}`);
            expect(commit.mock.calls[3][1].payload).toStrictEqual(expectedPayload);
        });

        it("sets error if time series data source not in control selections", async () => {
            const commit = vi.fn();
            const rootState = mockRootState();
            const payload = createPayload();
            payload.selections.controls = [];

            await getTimeSeriesFilteredDataset(payload, commit, rootState);

            expect(commit.mock.calls.length).toBe(2);
            expect(commit.mock.calls[0][0]).toStrictEqual(`genericChart/${GenericChartMutation.SetError}`);
            expect(commit.mock.calls[0][1]).toStrictEqual({payload: null});
            expect(commit.mock.calls[1][0]).toStrictEqual(`genericChart/${GenericChartMutation.SetError}`);
            expect(commit.mock.calls[1][1]).toStrictEqual({
                payload: {
                    detail: "Failed to update time series, time series data source is missing. Please report this to a system administrator.",
                    error: "TIME_SERIES_DATASOURCE_MISSING"
                }
            });
        });

        it("doesn't filter on property if can't find filter ID in filter types metadata", async () => {
            mockAxios.onGet(`/chart-data/input-time-series/anc`)
                .reply(200, mockSuccess(mockTimeSeriesData));

            const rootState = createMockRootState([])
            const commit = createMockCommit(rootState);
            const payload = createPayload();

            await getTimeSeriesFilteredDataset(payload, commit, rootState);

            expect(commit.mock.calls.length).toBe(4);
            expect(commit.mock.calls[0][0]).toStrictEqual(`genericChart/${GenericChartMutation.SetError}`);
            expect(commit.mock.calls[1][0]).toStrictEqual(`genericChart/${GenericChartMutation.SetDataset}`);
            expect(commit.mock.calls[2][0]).toStrictEqual(`genericChart/${GenericChartMutation.WarningsFetched}`);
            expect(commit.mock.calls[3][0]).toStrictEqual(`plotData/${PlotDataMutations.updatePlotData}`);
            const expectedPayload = {
                plot: "timeSeries",
                data: [
                    {
                        "data_source": "opt1",
                        "value": 1
                    },
                    {
                        "data_source": "opt2",
                        "value": 2
                    },
                ]
            };
            expect(commit.mock.calls[3][1].payload).toStrictEqual(expectedPayload);
        });
    });

    describe("getCalibrateFilteredDataset works as expected", () => {
        const payload = {
            plot: "calibrate",
            selections: {
                controls: [],
                filters: [mockFilterSelection({
                    filterId: "sex",
                    stateFilterId: "sex",
                    label: "Sex",
                    multiple: false,
                    selection: [{label: "Male", id: "male"}],
                })],
            }
        } as PlotSelectionUpdate;
        const commit = vi.fn()

        const createPlotDataRow = (sex: string) => ({
            data_type: "spectrum",
            spectrum_region_code: "0",
            spectrum_region_name: "MWI",
            sex: sex,
            age_group: "1",
            calendar_quarter: "1",
            indicator: 'mock',
            mean: 0.5,
        } as CalibratePlotResponse["data"][0]);

        it("returns early if no data in store", async () => {
            const rootState = mockRootState();

            await getCalibrateFilteredDataset(payload, commit, rootState);

            expect(commit.mock.calls.length).toBe(0);
        });

        it("filters data from store based on selections", async () => {
            const both_row = createPlotDataRow("both");
            const male_row = createPlotDataRow("male");
            const rootState = mockRootState({
                modelCalibrate: mockModelCalibrateState({
                    calibratePlotResult: mockCalibratePlotResponse({
                        data: [both_row, male_row],
                        metadata: {
                            filterTypes: [
                                {
                                    id: "sex",
                                    column_id: "sex",
                                    options: [
                                        {id: "male", label: "Male"},
                                        {id: "both", label: "Both"}
                                    ]
                                }
                            ],
                            indicators: [],
                            plotSettingsControl: {
                                calibrate: {
                                    plotSettings: [
                                        {
                                            id: "1",
                                            label: "setting",
                                            options: []
                                        }
                                    ]
                                }
                            }
                        }
                    })
                }),
            });

            await getCalibrateFilteredDataset(payload, commit, rootState);

            expect(commit.mock.calls.length).toBe(1);
            expect(commit.mock.calls[0][0]).toStrictEqual(`plotData/${PlotDataMutations.updatePlotData}`);
            expect(commit.mock.calls[0][1].payload).toStrictEqual({
                plot: "calibrate",
                data: [male_row]
            });
        });
    });

    describe("getComparisonFilteredDataset works as expected", () => {
        const payload = {
            plot: "comparison",
            selections: {
                controls: [],
                filters: [mockFilterSelection({
                    filterId: "sex",
                    stateFilterId: "sex",
                    label: "Sex",
                    multiple: false,
                    selection: [{label: "Male", id: "male"}],
                })],
            }
        } as PlotSelectionUpdate;
        const commit = vi.fn()

        const createPlotDataRow = (sex: string) => ({
            area_id: "MWI",
            area_name: "Malawi",
            sex: sex,
            age_group: "1",
            calendar_quarter: "1",
            indicator: 'mock',
            mean: 0.5,
            source: "1"
        } as ComparisonPlotRow);

        it("returns early if no data in store", async () => {
            const rootState = mockRootState();

            await getComparisonFilteredDataset(payload, commit, rootState);

            expect(commit.mock.calls.length).toBe(0);
        });

        it("filters data from store based on selections", async () => {
            const both_row = createPlotDataRow("both");
            const male_row = createPlotDataRow("male");
            const rootState = mockRootState({
                modelCalibrate: mockModelCalibrateState({
                    comparisonPlotResult: mockComparisonPlotResponse({
                        data: [both_row, male_row],
                        metadata: {
                            filterTypes: [
                                {
                                    id: "sex",
                                    column_id: "sex",
                                    options: [
                                        {id: "male", label: "Male"},
                                        {id: "both", label: "Both"}
                                    ]
                                }
                            ],
                            indicators: [],
                            plotSettingsControl: {
                                comparison: {
                                    plotSettings: [
                                        {
                                            id: "1",
                                            label: "setting",
                                            options: []
                                        }
                                    ]
                                }
                            }
                        }
                    })
                }),
            });

            await getComparisonFilteredDataset(payload, commit, rootState);

            expect(commit.mock.calls.length).toBe(1);
            expect(commit.mock.calls[0][0]).toStrictEqual(`plotData/${PlotDataMutations.updatePlotData}`);
            expect(commit.mock.calls[0][1].payload).toStrictEqual({
                plot: "comparison",
                data: [male_row]
            });
        });
    });

    describe("getInputChoroplethFilteredData works as expected", () => {
        const createPayload = (filterSelection: FilterSelection[]) => ({
            plot: "inputChoropleth",
            selections: {
                controls: [mockControlSelection({
                    id: "input_choropleth_data_source",
                    selection: [
                        {label: "ANC", id: "anc"},
                        {label: "ART", id: "art"}
                    ],
                })],
                filters: filterSelection,
            }
        } as PlotSelectionUpdate);

        const createAncDataRow = (age_group: string, year: number) => ({
            area_id: "MWI",
            age_group: age_group,
            year: year,
            anc_clients: 0,
            anc_known_pos: 0,
            anc_already_art: 0,
            anc_tested: 0,
            anc_tested_pos: 0,
            anc_prevalence: 0,
            anc_art_coverage: 0,
        } as AncDataRow);

        const row1 = createAncDataRow("1", 1970);
        const row2 = createAncDataRow("2", 1970);
        const row3 = createAncDataRow("1", 1971);
        const row4 = createAncDataRow("2", 1971);

        const createRootState = (() => {
            return mockRootState({
                surveyAndProgram: mockSurveyAndProgramState({
                    anc: mockAncResponse({
                        data: [row1, row2, row3, row4]
                    }),
                }),
                metadata: mockMetadataState({
                    reviewInputMetadata: mockReviewInputMetadata({
                        filterTypes: [
                            {
                                id: "age",
                                column_id: "age_group",
                                options: [
                                    {id: "1", label: "1"},
                                    {id: "2", label: "2"}
                                ]
                            },
                            {
                                id: "year",
                                column_id: "year",
                                options: [
                                    {id: "1970", label: "1970"},
                                    {id: "1971", label: "1971"}
                                ]
                            }
                        ]
                    })
                })
            })
        });

        const commit = vi.fn();

        it("commits empty plot data if survey and programme data is missing", async () => {
            const rootState = mockRootState();
            const payload = createPayload([mockFilterSelection({
                filterId: "age",
                stateFilterId: "age",
                label: "Age group filter",
                multiple: true,
                selection: [{id: "2", label: "2"}],
            })]);

            await getInputChoroplethFilteredData(payload, commit, rootState);

            expect(commit.mock.calls.length).toBe(1);
            expect(commit.mock.calls[0][0]).toStrictEqual(`plotData/${PlotDataMutations.updatePlotData}`);
            expect(commit.mock.calls[0][1].payload).toStrictEqual({
                plot: "inputChoropleth",
                data: []
            });
        });

        it("filters data and commits mutation", async () => {
            const rootState = createRootState();
            const payload = createPayload([mockFilterSelection({
                filterId: "age",
                stateFilterId: "age",
                label: "Age group filter",
                multiple: true,
                selection: [{id: "2", label: "2"}],
            })]);

            await getInputChoroplethFilteredData(payload, commit, rootState);

            expect(commit.mock.calls.length).toBe(1);
            expect(commit.mock.calls[0][0]).toStrictEqual(`plotData/${PlotDataMutations.updatePlotData}`);
            expect(commit.mock.calls[0][1].payload).toStrictEqual({
                plot: "inputChoropleth",
                data: [row2, row4]
            });
        });

        it("parses year and area level to string before filtering", async () => {
            const rootState = createRootState();
            const payload = createPayload([mockFilterSelection({
                filterId: "year",
                stateFilterId: "year",
                label: "Age group filter",
                multiple: true,
                selection: [{id: "1970", label: "1970"}],
            })]);
            await getInputChoroplethFilteredData(payload, commit, rootState);

            expect(commit.mock.calls.length).toBe(1);
            expect(commit.mock.calls[0][0]).toStrictEqual(`plotData/${PlotDataMutations.updatePlotData}`);
            expect(commit.mock.calls[0][1].payload).toStrictEqual({
                plot: "inputChoropleth",
                data: [row1, row2]
            });
        });

        it("returns full data if no filterable keys are available", async () => {
            const rootState = createRootState();
            const payload = createPayload([mockFilterSelection({
                filterId: "missing",
                stateFilterId: "missing",
                label: "Unknown filter",
                multiple: true,
                selection: [{id: "1970", label: "1970"}],
            })]);

            await getInputChoroplethFilteredData(payload, commit, rootState);

            expect(commit.mock.calls.length).toBe(1);
            expect(commit.mock.calls[0][0]).toStrictEqual(`plotData/${PlotDataMutations.updatePlotData}`);
            expect(commit.mock.calls[0][1].payload).toStrictEqual({
                plot: "inputChoropleth",
                data: [row1, row2, row3, row4]
            });
        });
    });
})
