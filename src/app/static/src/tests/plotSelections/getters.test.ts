import {
    mockCalibrateDataResponse,
    mockCalibrateMetadataResponse,
    mockCalibratePlotResponse,
    mockIndicatorMetadata,
    mockFilterSelection,
    mockModelCalibrateState,
    mockPlotSelectionsState,
    mockRootState,
    mockReviewInputState,
    mockInputComparisonMetadata,
    mockPopulationPyramidData
} from "../mocks";
import {getters, PopulationColors} from "../../app/store/plotSelections/getters";
import {PlotName} from "../../app/store/plotSelections/plotSelections";
import * as barUtils from "../../app/components/plots/bar/utils";
import {InputComparisonData} from "../../app/generated";
import {Language} from "../../app/store/translations/locales";

describe("plotSelections getters", () => {
    const filterSelections = [mockFilterSelection()]

    const xAxisOptions = [
        {
            label: "Option A",
            id: "optA"
        },
        {
            label: "Option B",
            id: "optB"
        },
        {
            label: "Option C",
            id: "optC"
        }
    ]

    const calibrateMetadata = mockCalibrateMetadataResponse({
        filterTypes: [
            {
                id: "x_axisControlSelection",
                column_id: "xAxisFilterCol",
                options: xAxisOptions
            }
        ]
    });

    const yearOptions = [
        {
            label: "2000",
            id: "2000"
        },
        {
            label: "2001",
            id: "2001"
        },
    ]

    const inputComparisonMetadata = mockInputComparisonMetadata({
        filterTypes: [
            {
                id: "year",
                column_id: "yearCol",
                options: yearOptions
            }
        ]
    })

    const rootGetters = {
        "modelCalibrate/filterIdToColumnId": (plotName: PlotName, id: string) => {
            return id + "ColumnId"
        },
        "baseline/areaIdToPropertiesMap": {"MWI_1_1": {area_level: 1}},
        "modelCalibrate/cascadePlotIndicators": ["disagg_byControlSelectionFilterSelectionB",
            "disagg_byControlSelectionFilterSelectionA"]
    };

    const mockGetters = {
        "controlSelectionFromId": (plotName: PlotName, controlId: string) => {
            return {
                label: "Option 1",
                id: controlId + "ControlSelection"
            }
        },
        "filterSelectionFromId": (plotName: PlotName, filterId: string) => {
            return [
                {
                    label: "Option A",
                    id: filterId + "FilterSelectionA"
                },
                {
                    label: "Option B",
                    id: filterId + "FilterSelectionB"
                }
            ]
        }
    };

    const mockPlotDataToChartData = vi
        .spyOn(barUtils, "plotDataToChartData")
        .mockImplementation(vi.fn().mockReturnValue({
            maxValuePlusError: 1,
            labels: ["A", "B"],
            datasets: [
                {
                    label: "Option A",
                },
                {
                    label: "Option B",
                }
            ] as any
        }));

    const mockInputComparisonPlotDataToChartData = vi
        .spyOn(barUtils, "inputComparisonPlotDataToChartData")
        .mockImplementation((...args) => {
            return {
                maxValuePlusError: 1,
                labels: ["A", "B"],
                datasets: []
            }
        })

    beforeEach(() => {
        vi.clearAllMocks()
    });

    it("can get control selection from ID", () => {
        const plotSelectionsState = mockPlotSelectionsState({
            choropleth: {
                controls: [
                    {
                        id: "control1",
                        label: "Control 1",
                        selection: [{
                            label: "Option 1",
                            id: "opt1"
                        }]
                    }
                ],
                filters: []
            }
        });

        const getter = getters.controlSelectionFromId(plotSelectionsState)

        expect(getter("choropleth", "control1")).toStrictEqual({
            label: "Option 1",
            id: "opt1"
        });
        expect(getter("choropleth", "control2")).toBe(undefined);
    });

    it("can get filter selection from ID", () => {
        const plotSelectionsState = mockPlotSelectionsState({
            choropleth: {
                controls: [],
                filters: [
                    {
                        filterId: "filter1",
                        stateFilterId: "filter1",
                        label: "Filter 1",
                        selection: [
                            {
                                label: "Option A",
                                id: "optA"
                            },
                            {
                                label: "Option B",
                                id: "optB"
                            }
                        ],
                        multiple: true,
                        hidden: false
                    },
                    {
                        filterId: "filter2",
                        stateFilterId: "stateFilter2",
                        label: "Filter 2",
                        selection: [
                            {
                                label: "Option A",
                                id: "optA"
                            }
                        ],
                        multiple: false,
                        hidden: false
                    }
                ]
            }
        });

        const getter = getters.filterSelectionFromId(plotSelectionsState)

        expect(getter("choropleth", "filter1")).toStrictEqual([
            {
                label: "Option A",
                id: "optA"
            },
            {
                label: "Option B",
                id: "optB"
            }
        ]);
        expect(getter("choropleth", "filter2")).toStrictEqual([]);
        expect(getter("choropleth", "stateFilter2")).toStrictEqual([
            {
                label: "Option A",
                id: "optA"
            }
        ]);
    });

    it("barchartData pulls bits from state and calls util", () => {
        const rootState = mockRootState({
            modelCalibrate: mockModelCalibrateState({
                metadata: calibrateMetadata
            })
        });

        const getter = getters.barchartData(mockPlotSelectionsState(), mockGetters, rootState, rootGetters);

        const plotData = mockCalibrateDataResponse();
        const indicatorMetadata = mockIndicatorMetadata();
        getter("barchart", plotData, indicatorMetadata, filterSelections, Language.en);

        expect(mockPlotDataToChartData.mock.calls.length).toBe(1)
        expect(mockPlotDataToChartData.mock.calls[0][0]).toStrictEqual(plotData)
        expect(mockPlotDataToChartData.mock.calls[0][1]).toStrictEqual(indicatorMetadata)
        expect(mockPlotDataToChartData.mock.calls[0][2]).toStrictEqual("disagg_byControlSelectionColumnId")
        expect(mockPlotDataToChartData.mock.calls[0][3]).toStrictEqual([
            {
                label: "Option A",
                id: "disagg_byControlSelectionFilterSelectionA"
            },
            {
                label: "Option B",
                id: "disagg_byControlSelectionFilterSelectionB"
            }
        ])
        expect(mockPlotDataToChartData.mock.calls[0][4]).toStrictEqual("x_axisControlSelectionColumnId")
        expect(mockPlotDataToChartData.mock.calls[0][5]).toStrictEqual([
            {
                label: "Option A",
                id: "x_axisControlSelectionFilterSelectionA"
            },
            {
                label: "Option B",
                id: "x_axisControlSelectionFilterSelectionB"
            }
        ])
        expect(mockPlotDataToChartData.mock.calls[0][6]).toStrictEqual(xAxisOptions)
        expect(mockPlotDataToChartData.mock.calls[0][7]).toStrictEqual("detailOptA")
        expect(mockPlotDataToChartData.mock.calls[0][8]).toStrictEqual({"MWI_1_1": {area_level: 1}})
    });

    it("barchartData getters returns empty if xaxis or disaggregate not set", () => {
        const plotSelectionsState = mockPlotSelectionsState();
        const rootState = mockRootState();
        const mockGetters = {
            "controlSelectionFromId": (plotName: PlotName, controlId: string) => {
                return null
            }
        };

        const getter = getters.barchartData(plotSelectionsState, mockGetters, rootState, rootGetters);

        const plotData = mockCalibrateDataResponse();
        const indicatorMetadata = mockIndicatorMetadata();
        expect(getter("barchart", plotData, indicatorMetadata, [], Language.en)).toStrictEqual({
            datasets: [],
            labels: [],
            maxValuePlusError: 0
        });
    });

    it("barchartData getter returns empty if xAxis or disaggregate by are not set", () => {
        const plotSelectionsState = mockPlotSelectionsState();
        const rootState = mockRootState({
            modelCalibrate: mockModelCalibrateState({
                metadata: calibrateMetadata
            })
        });
        const mockRootGetters = {
            "modelCalibrate/filterIdToColumnId": (plotName: PlotName, filterId: string) => {
                return null
            }
        }

        const getter = getters.barchartData(plotSelectionsState, mockGetters, rootState, mockRootGetters);

        const plotData = mockCalibrateDataResponse();
        const indicatorMetadata = mockIndicatorMetadata();
        expect(getter("barchart", plotData, indicatorMetadata, [], Language.en)).toStrictEqual({
            datasets: [],
            labels: [],
            maxValuePlusError: 0
        });
    });

    it("barchartData doesn't pass area level and area id map if viewing calibration plot", () => {
        // Doesn't pass areaLevel or areaIdToPropertiesMap if called for calibrate plot
        // these are only required to build error bars, which we don't have on calibrate plot
        const rootState = mockRootState({
            modelCalibrate: mockModelCalibrateState({
                calibratePlotResult: mockCalibratePlotResponse({
                    metadata: {
                        filterTypes: [
                            {
                                id: "x_axisControlSelection",
                                column_id: "xAxisFilterCol",
                                options: xAxisOptions
                            }
                        ],
                        indicators: [],
                        plotSettingsControl: {
                            calibrate: {
                                plotSettings: []
                            }
                        },
                        warnings: []
                    },
                })
            })
        });

        const getter = getters.barchartData(mockPlotSelectionsState(), mockGetters, rootState, rootGetters);

        const plotData = mockCalibrateDataResponse();
        const indicatorMetadata = mockIndicatorMetadata();
        getter("calibrate", plotData, indicatorMetadata, filterSelections, Language.en);

        expect(mockPlotDataToChartData.mock.calls.length).toBe(1)
        expect(mockPlotDataToChartData.mock.calls[0][7]).toStrictEqual(null)
        expect(mockPlotDataToChartData.mock.calls[0][8]).toStrictEqual({})
    });

    it("barchartData calls input comparison data prep function", () => {
        const rootState = mockRootState({
            reviewInput: mockReviewInputState({
                inputComparison: {
                    loading: false,
                    error: null,
                    data: {
                        data: {anc: [], art: []},
                        metadata: inputComparisonMetadata,
                        warnings: []
                    },
                    dataSource: null
                }
            })
        });

        const getter = getters.barchartData(mockPlotSelectionsState(), mockGetters, rootState, rootGetters);

        const plotData: InputComparisonData["anc"] = [
            {indicator: "prevalence", area_name: "Malawi", year: 2020, group: "Adult Males", value_spectrum: 2, value_naomi: 3}
        ]
        const indicatorMetadata = mockIndicatorMetadata();
        getter("inputComparisonBarchart", plotData, indicatorMetadata, filterSelections, Language.en);

        expect(mockInputComparisonPlotDataToChartData.mock.calls.length).toBe(1);
        expect(mockInputComparisonPlotDataToChartData.mock.calls[0][0]).toStrictEqual(plotData);
        expect(mockInputComparisonPlotDataToChartData.mock.calls[0][1]).toStrictEqual(indicatorMetadata);
        expect(mockInputComparisonPlotDataToChartData.mock.calls[0][2]).toStrictEqual("year");
        expect(mockInputComparisonPlotDataToChartData.mock.calls[0][3]).toStrictEqual([
            {
                "id": "yearFilterSelectionA",
                "label": "Option A",
            },
            {
                "id": "yearFilterSelectionB",
                "label": "Option B",
            },
        ]);
        expect(mockInputComparisonPlotDataToChartData.mock.calls[0][4]).toStrictEqual(yearOptions);
        expect(mockInputComparisonPlotDataToChartData.mock.calls[0][5]).toStrictEqual(Language.en);
    });

    it("barchartData adds specific overrides for cascade barchart", () => {
        const rootState = mockRootState({
            modelCalibrate: mockModelCalibrateState({
                metadata: calibrateMetadata
            })
        });

        const getter = getters.barchartData(mockPlotSelectionsState(), mockGetters, rootState, rootGetters);

        const plotData = mockCalibrateDataResponse();
        const indicatorMetadata = mockIndicatorMetadata();
        const data = getter("cascade", plotData, indicatorMetadata,
            filterSelections, Language.en);

        expect(mockPlotDataToChartData.mock.calls.length).toBe(1)

        // Datasets are in correct order
        expect(data.datasets[0].label).toBe("Option B");
        expect(data.datasets[1].label).toBe("Option A");
    });

    const populationData = {
        data: [
            {
                area_id: "MWI_4_10_demo",
                area_name: "Ntchisi",
                calendar_quarter: "CY2008Q2",
                sex: "female",
                age_group: "Y000_004",
                population: 2
            },
            {
                area_id: "MWI_4_10_demo",
                area_name: "Ntchisi",
                calendar_quarter: "CY2008Q2",
                sex: "female",
                age_group: "Y005_009",
                population: 3
            },
            {
                area_id: "MWI_4_10_demo",
                area_name: "Ntchisi",
                calendar_quarter: "CY2008Q2",
                sex: "male",
                age_group: "Y000_004",
                population: 4
            },
            {
                area_id: "MWI_4_10_demo",
                area_name: "Ntchisi",
                calendar_quarter: "CY2008Q2",
                sex: "male",
                age_group: "Y005_009",
                population: 5
            }
        ],
        nationalLevelData: [
            {
                area_id: "MWI",
                area_name: "Malawi",
                calendar_quarter: "CY2008Q2",
                sex: "female",
                age_group: "Y000_004",
                population: 2
            },
            {
                area_id: "MWI",
                area_name: "Malawi",
                calendar_quarter: "CY2008Q2",
                sex: "female",
                age_group: "Y005_009",
                population: 3
            },
            {
                area_id: "MWI",
                area_name: "Malawi",
                calendar_quarter: "CY2008Q2",
                sex: "male",
                age_group: "Y000_004",
                population: 4
            },
            {
                area_id: "MWI",
                area_name: "Malawi",
                calendar_quarter: "CY2008Q2",
                sex: "male",
                age_group: "Y005_009",
                population: 5
            },
        ]
    };

    it ('population data returns two datasets when population plot type is selected', () => {
        const getter = getters.populationChartData(mockPlotSelectionsState(), mockGetters);

        const ageGroups = [
            {id:"Y010_014",label:"10-14"},
            {id:"Y005_009",label:"5-9"},
            {id:"Y000_004",label:"0-4"}
        ];

        const data = getter('population', populationData, ageGroups);

        expect(data).toHaveLength(1);
        expect(data[0].title).toStrictEqual("Ntchisi");
        const datasets = data[0].datasets;
        expect(datasets).toHaveLength(2);
        expect(datasets[0]).toStrictEqual({
            label: "Female",
            data: [0, 3, 2],
            backgroundColor: PopulationColors.FEMALE,
            isOutline: false,
            isMale: false
        });
        expect(datasets[1]).toStrictEqual({
            label: "Male",
            data: [-0, -5, -4],
            backgroundColor: PopulationColors.MALE,
            isOutline: false,
            isMale: true
        });
    })

    it ('population data calculates proportion and returns four datasets when proportion plot type is selected', () => {
        const mockGetters = {
            controlSelectionFromId: (plotName: PlotName, controlId: string) => {
                return {id: 'population_proportion'}
            }
        };

        const getter = getters.populationChartData(mockPlotSelectionsState(), mockGetters);

        const ageGroups = [
            {id:"Y010_014",label:"10-14"},
            {id:"Y005_009",label:"5-9"},
            {id:"Y000_004",label:"0-4"}
        ];

        const data = getter('population', populationData, ageGroups);

        expect(data).toHaveLength(1);
        expect(data[0].title).toStrictEqual("Ntchisi");
        const datasets = data[0].datasets;
        expect(datasets).toHaveLength(4);
        expect(datasets[0]).toStrictEqual({
            label: "Female",
            data: [0, 3/5, 2/5],
            backgroundColor: PopulationColors.FEMALE,
            isOutline: false,
            isMale: false
        });
        expect(datasets[1]).toStrictEqual({
            label: "Male",
            data: [-0, -5/9, -4/9],
            backgroundColor: PopulationColors.MALE,
            isOutline: false,
            isMale: true
        });
        expect(datasets[2]).toStrictEqual({
            label: "Female",
            data: [0, 3/5, 2/5],
            backgroundColor: PopulationColors.OUTLINE,
            isOutline: true,
            isMale: false
        });
        expect(datasets[3]).toStrictEqual({
            label: "Male",
            data: [-0, -5/9, -4/9],
            backgroundColor: PopulationColors.OUTLINE,
            isOutline: true,
            isMale: true
        });
    })

    it ('population data returns 0 datasets when plot type not known ', () => {
        const plotData = mockPopulationPyramidData();
        const mockGetters = {
            controlSelectionFromId: (plotName: PlotName, controlId: string) => {
                return null
            }
        };
        const getter = getters.populationChartData(mockPlotSelectionsState(), mockGetters);
        const ageGroups = [
            {id:"Y010_014",label:"10-14"},
            {id:"Y005_009",label:"5-9"},
            {id:"Y000_004",label:"0-4"}
        ];

        const data = getter('population', plotData, ageGroups);

        expect(data).toStrictEqual([]);
    });
});
