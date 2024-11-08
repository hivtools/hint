import {
    buildTooltipCallback,
    ErrorBars,
    getErrorLineAnnotations, inputComparisonPlotDataToChartData,
    plotDataToChartData
} from "../../../../app/components/plots/bar/utils";
import {PlotData} from "../../../../app/store/plotData/plotData";
import {IndicatorMetadata, FilterOption, InputComparisonData} from "../../../../app/generated";
import {mockIndicatorMetadata} from "../../../mocks";
import {Language} from "../../../../app/store/translations/locales";

describe("barchart utils work as expected", () => {
    const indicator = mockIndicatorMetadata()

    const data: PlotData = [
        {area_id: "MWI_1_1", age_group: '0:4', sex: 'female', calendar_quarter: "1", indicator: "prevalence", mode: null, mean: 0.40, upper: 0.43, lower: 0.38},
        {area_id: "MWI_1_1", age_group: '5:9', sex: 'female', calendar_quarter: "1", indicator: "prevalence",  mode: null, mean: 0.20, upper: 0.24, lower: 0.16},
        {area_id: "MWI_1_1", age_group: '0:4', sex: 'male', calendar_quarter: "1", indicator: "prevalence",  mode: null, mean: 0.35, upper: 0.40, lower: 0.34},
        {area_id: "MWI_1_1", age_group: '5:9', sex: 'male', calendar_quarter: "1", indicator: "prevalence",  mode: null, mean: 0.25, upper: 0.28, lower: 0.21},
    ];

    const inputComparisonData: InputComparisonData = [
        {indicator: "prevalence", area_name: "Malawi", year: 2020, group: "Adult Males", value_spectrum: 2001, value_naomi: 3000},
        {indicator: "prevalence", area_name: "Malawi", year: 2021, group: "Adult Males", value_spectrum: null, value_naomi: 2000},
        {indicator: "prevalence", area_name: "Malawi", year: 2022, group: "Adult Males", value_spectrum: 5001, value_naomi: 2000},
        {indicator: "prevalence", area_name: "Malawi", year: 2023, group: "Adult Males", value_spectrum: 6000, value_naomi: 6000},
    ]

    const xAxis = "age_group";
    const xAxisSelections: FilterOption[] = [
        {id: "5:9", label: "5-9"},
        {id: "0:4", label: "0-4"}
    ];
    const xAxisOptions: FilterOption[] = [
        {id: "0:4", label: "0-4"},
        {id: "5:9", label: "5-9"},
        {id: "10:14", label: "10-14"}
    ];
    const disAggBy = "sex";
    const disAggSelections: FilterOption[] = [
        {id: "female", label: "female"},
        {id: "male", label: "male"}
    ];

    const errorBars: ErrorBars = {
        "group1": {plus: 1.1, minus: 0.9},
        "group2": {plus: 2.1, minus: 1.9}
    };

    const maxBarThickness = 175;

    const chartData = {
        labels: ["group1"],
        datasets: [
            {
                label: "dataset1",
                backgroundColor: "#111111",
                data: [1, 2],
                errorBars,
                maxBarThickness,
                tooltipExtraText: []
            },
        ],
        maxValuePlusError: 0.2
    };

    it("can get barchart data", () => {
        const result = plotDataToChartData(data, indicator,
            disAggBy, disAggSelections,
            xAxis, xAxisSelections, xAxisOptions,
            null, {});

        expect(result).toStrictEqual({
            labels: ["0-4", "5-9"],
            datasets: [
                {
                    label: "female",
                    backgroundColor: "#e41a1c",
                    data: [0.40, 0.20],
                    errorBars: {
                        "0-4": {plus: 0.43, minus: 0.38},
                        "5-9": {plus: 0.24, minus: 0.16}
                    },
                    tooltipExtraText: [],
                    maxBarThickness
                },
                {
                    label: "male",
                    backgroundColor: "#377eb8",
                    data: [0.35, 0.25],
                    errorBars: {
                        "0-4": {plus: 0.40, minus: 0.34},
                        "5-9": {plus: 0.28, minus: 0.21}
                    },
                    tooltipExtraText: [],
                    maxBarThickness
                }
            ],
            maxValuePlusError: 0.43
        });
    });

    it("doesn't set max height if error columns not set", () => {
        const indicator: IndicatorMetadata = {
            indicator: "prevalence",
            value_column: "mean",
            indicator_column: "indicator",
            indicator_value: "prevalence",
            name: "Prevalence",
            min: 0,
            max: 1,
            colour: "interpolateReds",
            invert_scale: false,
            format: "0.00",
            scale: 1,
            accuracy: null
        };

        const result = plotDataToChartData(data, indicator,
            disAggBy, disAggSelections,
            xAxis, xAxisSelections, xAxisOptions,
            null, {});

        expect(result.maxValuePlusError).toStrictEqual(0);
    });

    it("shows label but with bar at 0 if data not avaialble", () => {
        const data: PlotData = [
            {
                area_id: "MWI_1_1",
                age_group: '0:4',
                sex: 'female',
                calendar_quarter: "1",
                indicator: "prevalence",
                mode: null,
                mean: null,
                upper: 0.43,
                lower: 0.38
            },
            {
                area_id: "MWI_1_1",
                age_group: '5:9',
                sex: 'female',
                calendar_quarter: "1",
                indicator: "prevalence",
                mode: null,
                mean: 0.20,
                upper: 0.24,
                lower: 0.16
            },
        ];

        const result = plotDataToChartData(data, indicator,
            disAggBy, disAggSelections,
            xAxis, xAxisSelections, xAxisOptions,
            null, {});

        expect(result).toStrictEqual({
            labels: ["0-4", "5-9"],
            datasets: [
                {
                    label: "female",
                    backgroundColor: "#e41a1c",
                    data: [0, 0.20],
                    errorBars: {
                        "5-9": {plus: 0.24, minus: 0.16},
                    },
                    tooltipExtraText: [],
                    maxBarThickness
                }
            ],
            maxValuePlusError: 0.24
        });
    });

    it("filters on area level if x-axis is area_id", () => {
        const data: PlotData = [
            {
                area_id: "MWI_1_1",
                age_group: '0:4',
                sex: 'female',
                calendar_quarter: "1",
                indicator: "prevalence",
                mode: null,
                mean: 0.40,
                upper: 0.43,
                lower: 0.38
            },
            {
                area_id: "MWI_1_1",
                age_group: '0:4',
                sex: 'male',
                calendar_quarter: "1",
                indicator: "prevalence",
                mode: null,
                mean: 0.20,
                upper: 0.24,
                lower: 0.16
            },
            {
                area_id: "MWI_1_2",
                age_group: '0:4',
                sex: 'female',
                calendar_quarter: "1",
                indicator: "prevalence",
                mode: null,
                mean: 0.40,
                upper: 0.43,
                lower: 0.38
            },
            {
                area_id: "MWI_1_2",
                age_group: '0:4',
                sex: 'male',
                calendar_quarter: "1",
                indicator: "prevalence",
                mode: null,
                mean: 0.20,
                upper: 0.24,
                lower: 0.16
            },
            {
                area_id: "MWI_2_1",
                age_group: '0:4',
                sex: 'female',
                calendar_quarter: "1",
                indicator: "prevalence",
                mode: null,
                mean: 0.35,
                upper: 0.40,
                lower: 0.34
            },
            {
                area_id: "MWI_2_1",
                age_group: '0:4',
                sex: 'male',
                calendar_quarter: "1",
                indicator: "prevalence",
                mode: null,
                mean: 0.25,
                upper: 0.28,
                lower: 0.21
            },
        ];
        const areaLevel = "1";
        const areaIdToLevelMap = {
            "MWI_1_1": 1,
            "MWI_1_2": 1,
            "MWI_2_1": 2
        };

        const xAxis = "area_id";
        const xAxisSelections: FilterOption[] = [
            {id: "MWI_1_1", label: "Northern"},
            {id: "MWI_1_2", label: "Central"},
            {id: "MWI_2_1", label: "Other"}
        ];
        const xAxisOptions: FilterOption[] = [
            {id: "MWI_1_1", label: "Northern"},
            {id: "MWI_1_2", label: "Central"},
            {id: "MWI_2_1", label: "Other"}
        ];

        const result = plotDataToChartData(data, indicator,
            disAggBy, disAggSelections,
            xAxis, xAxisSelections, xAxisOptions,
            areaLevel, areaIdToLevelMap)

        expect(result).toStrictEqual({
            labels: ["Northern", "Central"],
            datasets: [
                {
                    label: "female",
                    backgroundColor: "#e41a1c",
                    data: [0.40, 0.40],
                    errorBars: {
                        "Northern": {plus: 0.43, minus: 0.38},
                        "Central": {plus: 0.43, minus: 0.38},
                    },
                    tooltipExtraText: [],
                    maxBarThickness
                },
                {
                    label: "male",
                    backgroundColor: "#377eb8",
                    data: [0.20, 0.20],
                    errorBars: {
                        "Northern": {plus: 0.24, minus: 0.16},
                        "Central": {plus: 0.24, minus: 0.16}
                    },
                    tooltipExtraText: [],
                    maxBarThickness
                }
            ],
            maxValuePlusError: 0.43
        });
    });

    it("can get barchart data for input comparison", () => {
        const xAxis = "year";
        const xAxisSelections: FilterOption[] = [
            {id: "2022", label: "2022"},
            {id: "2020", label: "2020"},
            {id: "2021", label: "2021"},
            {id: "2023", label: "2023"},
        ];
        const xAxisOptions: FilterOption[] = [
            {id: "2020", label: "2020"},
            {id: "2021", label: "2021"},
            {id: "2022", label: "2022"},
            {id: "2023", label: "2023"},
            {id: "2024", label: "2024"},
        ];
        const indicator: IndicatorMetadata = {
            indicator: "prevalence",
            value_column: "mean",
            indicator_column: "indicator",
            indicator_value: "prevalence",
            name: "Prevalence",
            min: 0,
            max: 1,
            colour: "interpolateReds",
            invert_scale: false,
            format: "0,0",
            scale: 1,
            accuracy: null
        };

        const result = inputComparisonPlotDataToChartData(
            inputComparisonData, indicator, xAxis, xAxisSelections, xAxisOptions, Language.en);

        expect(result).toStrictEqual({
            labels: ["2020", "2021", "2022", "2023"],
            datasets: [
                {
                    label: "Naomi",
                    backgroundColor: "#e41a1c",
                    data: [3000, 2000, 2000, 6000],
                    errorBars: {},
                    tooltipExtraText: ["Difference from Spectrum: 999", "", "Difference from Spectrum: -3,001",
                        "Difference from Spectrum: 0"],
                    maxBarThickness
                },
                {
                    label: "Spectrum",
                    backgroundColor: "#377eb8",
                    data: [2001, null, 5001, 6000],
                    errorBars: {},
                    tooltipExtraText: ["Difference from Naomi: -999", "", "Difference from Naomi: 3,001",
                        "Difference from Naomi: 0"],
                    maxBarThickness
                },
            ],
            maxValuePlusError: 0
        });

        // Tooltip text is translated
        const resultFr = inputComparisonPlotDataToChartData(
            inputComparisonData, indicator, xAxis, xAxisSelections, xAxisOptions, Language.fr);

        expect(resultFr.datasets[0].tooltipExtraText)
            .toStrictEqual(["Différence avec le Spectrum: 999", "", "Différence avec le Spectrum: -3,001",
                "Différence avec le Spectrum: 0"],)
    });

    it("computes correct error line annotations", async () => {
        const expectedAnnotations = [
            {
                borderColor: "#585858",
                borderWidth: 1,
                display: false,
                drawTime: "afterDatasetsDraw",
                label: {
                    content: "dataset1",
                },
                type: "line",
                xMax: 0,
                xMin: 0,
                yMax: 1.1,
                yMin: 0.9,
            },
            {
                borderColor: "#585858",
                borderWidth: 1,
                display: false,
                drawTime: "afterDatasetsDraw",
                label: {
                    content: "dataset1",
                },
                type: "line",
                xMax: 0.01090909090909091,
                xMin: -0.01090909090909091,
                yMax: 1.1,
                yMin: 1.1,
            },
            {
                borderColor: "#585858",
                borderWidth: 1,
                display: false,
                drawTime: "afterDatasetsDraw",
                label: {
                    content: "dataset1",
                },
                type: "line",
                xMax: 0.01090909090909091,
                xMin: -0.01090909090909091,
                yMax: 0.9,
                yMin: 0.9,
            },
            {
                borderColor: "#585858",
                borderWidth: 1,
                display: false,
                drawTime: "afterDatasetsDraw",
                label: {
                    content: "dataset1",
                },
                type: "line",
                xMax: -1,
                xMin: -1,
                yMax: 2.1,
                yMin: 1.9,
            },
            {
                borderColor: "#585858",
                borderWidth: 1,
                display: false,
                drawTime: "afterDatasetsDraw",
                label: {
                    content: "dataset1",
                },
                type: "line",
                xMax: -0.9890909090909091,
                xMin: -1.010909090909091,
                yMax: 2.1,
                yMin: 2.1,
            },
            {
                borderColor: "#585858",
                borderWidth: 1,
                display: false,
                drawTime: "afterDatasetsDraw",
                label: {
                    content: "dataset1",
                },
                type: "line",
                xMax: -0.9890909090909091,
                xMin: -1.010909090909091,
                yMax: 1.9,
                yMin: 1.9,
            },
        ]

        const annotations = getErrorLineAnnotations(chartData, false, [true])
        expect(annotations).toStrictEqual(expectedAnnotations);
    });

    it("no error line annotations if showLabelErrorBars is false", async () => {
        const annotations = getErrorLineAnnotations(chartData, false, [false])
        expect(annotations).toStrictEqual([]);
    });

    it("no error line annotations if chart data label is missing", async () => {
        const dataNoLabels = {
            ...chartData,
            labels: undefined
        }
        const annotations = getErrorLineAnnotations(dataNoLabels, false, [true])
        expect(annotations).toStrictEqual([]);
    });

    it("no error line annotations if no data available", async () => {
        const noDatasets = {
            ...chartData,
            datasets: []
        }
        const annotations = getErrorLineAnnotations(noDatasets, false, [true])
        expect(annotations).toStrictEqual([]);
    });

    it("tooltip label callback can include uncertainty ranges", async () => {
        const metadata = mockIndicatorMetadata({
            format: "0.0"
        });
        const tooltipCallback = buildTooltipCallback(metadata, true, true);

        let renderedLabel = tooltipCallback({
            datasetIndex: 0,
            raw: 2,
            label: "group2",
            dataset: {
                label: "dataset1",
                backgroundColor: "#111111",
                data: [1, 2],
                errorBars: errorBars
            }
        });
        expect(renderedLabel).toBe("dataset1: 2.0 (1.9 - 2.1)");
    });

    it("tooltip label callback can skip rounding", async () => {
        const metadata = mockIndicatorMetadata({
            accuracy: 100,
            format: "0,0"
        });
        const tooltipCallback = buildTooltipCallback(metadata, true, false);
        const errorBars: ErrorBars = {
            "group1": {plus: 100053, minus: 9999},
            "group2": {plus: 210002, minus: 19231}
        };

        let renderedLabel = tooltipCallback({
            datasetIndex: 0,
            raw: 200001,
            label: "group2",
            dataset: {
                label: "dataset1",
                backgroundColor: "#111111",
                data: [100001, 200001],
                errorBars: errorBars
            }
        });
        expect(renderedLabel).toBe("dataset1: 200,001 (19,231 - 210,002)");
    });

    it("tooltip label callback does not render uncertainty ranges if given showErrors contains null values", async () => {
        const metadata = mockIndicatorMetadata({
            format: "0.0"
        });
        const tooltipCallback = buildTooltipCallback(metadata, true, true);

        const nullErrorBars = {
            "group1": { plus: null, minus: null },
            "group2": { plus: null, minus: null }
        }

        let renderedLabel = tooltipCallback({
            datasetIndex: 0,
            raw: 2,
            label: "group2",
            dataset: {
                label: "dataset1",
                backgroundColor: "#111111",
                data: [1, 2],
                errorBars: nullErrorBars
            }
        });
        expect(renderedLabel).toBe("dataset1: 2.0");
    });

    it("tooltip label callback does not render uncertainty ranges if showErrorRange is false", async () => {
        const metadata = mockIndicatorMetadata({
            format: "0.0"
        });
        const tooltipCallback = buildTooltipCallback(metadata, false, true);

        let renderedLabel = tooltipCallback({
            datasetIndex: 0,
            raw: 2,
            label: "group2",
            dataset: {
                label: "dataset1",
                backgroundColor: "#111111",
                data: [1, 2],
                errorBars: errorBars
            }
        });
        expect(renderedLabel).toBe("dataset1: 2.0");
    });
})
