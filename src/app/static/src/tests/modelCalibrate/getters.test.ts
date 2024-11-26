import {
    mockCalibrateMetadataResponse,
    mockInputComparisonMetadata,
    mockInputComparisonState,
    mockModelCalibrateState,
    mockReviewInputState,
    mockRootState
} from "../mocks";
import {getters} from "../../app/store/modelCalibrate/getters";
import {InputComparisonResponse} from "../../app/generated";

describe("modelCalibrate getters", () => {
    it("can get column ID from filter ID", () => {
        const calibrateResponse = mockCalibrateMetadataResponse({
            filterTypes: [
                {
                    id: "filter1",
                    column_id: "column1",
                    options: []
                },
                {
                    id: "filter2",
                    column_id: "column2",
                    options: []
                },
            ]
        })
        const calibrateState = mockModelCalibrateState({
            metadata: calibrateResponse
        });
        const rootState = mockRootState({
            modelCalibrate: calibrateState
        });
        const getter = getters.filterIdToColumnId(calibrateState, null, rootState);

        expect(getter("choropleth", "filter1")).toStrictEqual("column1");
        expect(getter("choropleth", "filter2")).toStrictEqual("column2");
    });

    it("can tableMetadata from custom plot effects", () => {
        const calibrateResponse = mockCalibrateMetadataResponse({
            plotSettingsControl: {
                choropleth: {
                    plotSettings: []
                },
                barchart: {
                    plotSettings: []
                },
                table: {
                    plotSettings: [{
                        id: "presets",
                        label: "Table presets",
                        options: [
                            {
                                id: "opt1",
                                label: "Option 1",
                                effect: {
                                    customPlotEffect: {
                                        row: ["age"],
                                        column: ["sex"]
                                    }
                                }
                            }
                        ]
                    }]
                },
                bubble: {
                    plotSettings: []
                },
                cascade: {
                    plotSettings: []
                },
            }
        })
        const calibrateState = mockModelCalibrateState({
            metadata: calibrateResponse
        });
        const rootState = mockRootState({
            modelCalibrate: calibrateState
        });
        const mockControlSelectionFromId = vi.fn().mockImplementation(() => {
            return {
                label: "Option 1",
                id: "opt1"
            }
        })
        const rootGetters = {
            "plotSelections/controlSelectionFromId": mockControlSelectionFromId
        }
        const getter = getters.tableMetadata({} as any, null, rootState, rootGetters);

        expect(getter("table")).toStrictEqual({
            row: ["age"],
            column: ["sex"]
        });
    });

    it("can get tableMetadata from default effect if no effect on plot control", () => {
        const inputComparisonResponse: InputComparisonResponse = {
            data: [],
            warnings: [],
            metadata: mockInputComparisonMetadata({
                plotSettingsControl: {
                    inputComparisonBarchart: {
                        plotSettings: []
                    },
                    inputComparisonTable: {
                        defaultEffect: {
                            customPlotEffect: {
                                row: ["age"],
                                column: ["sex"]
                            }
                        },
                        plotSettings: []
                    }
                }
            })
        }
        const reviewInput = mockReviewInputState({
            inputComparison: mockInputComparisonState({
                data: inputComparisonResponse
            })
        });
        const rootState = mockRootState({
            reviewInput
        });
        // No control selection so this will be undefined
        const mockControlSelectionFromId = vi.fn().mockImplementation(() => {
            return undefined
        });
        const rootGetters = {
            "plotSelections/controlSelectionFromId": mockControlSelectionFromId
        };
        const getter = getters.tableMetadata({} as any, null, rootState, rootGetters);

        expect(getter("inputComparisonTable")).toStrictEqual({
            row: ["age"],
            column: ["sex"]
        });
    });

    it("tableMetadata returns undefined if no custom table metadata", () => {
        const inputComparisonResponse: InputComparisonResponse = {
            data: [],
            warnings: [],
            metadata: mockInputComparisonMetadata({
                plotSettingsControl: {
                    inputComparisonBarchart: {
                        plotSettings: []
                    },
                    inputComparisonTable: {
                        plotSettings: []
                    }
                }
            })
        }
        const reviewInput = mockReviewInputState({
            inputComparison: mockInputComparisonState({
                data: inputComparisonResponse
            })
        });
        const rootState = mockRootState({
            reviewInput
        });
        // No control selection so this will be undefined
        const mockControlSelectionFromId = vi.fn().mockImplementation(() => {
            return undefined
        });
        const rootGetters = {
            "plotSelections/controlSelectionFromId": mockControlSelectionFromId
        };
        const getter = getters.tableMetadata({} as any, null, rootState, rootGetters);

        expect(getter("inputComparisonTable")).toBe(undefined);
    });

    it("tableMetadata returns undefined if preset configured but no custom effect", () => {
        const calibrateResponse = mockCalibrateMetadataResponse({
            plotSettingsControl: {
                choropleth: {
                    plotSettings: []
                },
                barchart: {
                    plotSettings: []
                },
                table: {
                    plotSettings: [{
                        id: "presets",
                        label: "Table presets",
                        options: [
                            {
                                id: "opt1",
                                label: "Option 1",
                                effect: {}
                            }
                        ]
                    }]
                },
                bubble: {
                    plotSettings: []
                },
                cascade: {
                    plotSettings: []
                },
            }
        })
        const calibrateState = mockModelCalibrateState({
            metadata: calibrateResponse
        });
        const rootState = mockRootState({
            modelCalibrate: calibrateState
        });
        const mockControlSelectionFromId = vi.fn().mockImplementation(() => {
            return {
                label: "Option 1",
                id: "opt1"
            }
        })
        const rootGetters = {
            "plotSelections/controlSelectionFromId": mockControlSelectionFromId
        }
        const getter = getters.tableMetadata({} as any, null, rootState, rootGetters);

        expect(getter("table")).toBe(undefined);
    });

    it("can get indicator for cascade plot in hard coded order", () => {
        const calibrateResponse = mockCalibrateMetadataResponse({
            plotSettingsControl: {
                choropleth: {
                    plotSettings: []
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
                    defaultEffect: {
                        setFilterValues: {
                            indicator: ["a", "b"]
                        }
                    },
                    plotSettings: []
                },
            }
        });
        const state = mockModelCalibrateState({
            metadata: calibrateResponse
        });
        const indicator = getters.cascadePlotIndicators(state);

        expect(indicator).toStrictEqual(["a", "b"]);
    });
});
