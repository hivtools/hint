import {ChartData, ChartDataset, DefaultDataPoint} from "chart.js";
import {IndicatorMetadata, FilterOption} from "../../../generated";
import {AnnotationOptions} from "chartjs-plugin-annotation";
import {formatOutput} from "../utils";
import {PlotData} from "../../../store/plotData/plotData";
import {Dict} from "../../../types";
import i18next from "i18next";
import {AreaProperties} from "../../../store/baseline/baseline";
import {InputComparisonPlotData} from "../../../store/reviewInput/reviewInput";

type BarChartDataset<Data> = ChartDataset<"bar", Data>

type BarChartDefaultData = DefaultDataPoint<"bar">

export interface ErrorBars {
    [xLabel: string]: {
        minus: number | null | undefined
        plus: number | null | undefined
    }
}

export type ChartDataSetsWithErrors<Data = BarChartDefaultData> = BarChartDataset<Data> & {
    errorBars?: ErrorBars,
    tooltipExtraText: string[]
}

type ChartDataWithErrors<Data = BarChartDefaultData> = Omit<ChartData<"bar", Data, string>, "datasets"> & { datasets: ChartDataSetsWithErrors<Data>[] }

export interface BarChartData<Data = BarChartDefaultData> extends ChartDataWithErrors<Data> { maxValuePlusError: number }

/**
 * Convert from PlotData into data required for Chart.js barchart
 * @param plotData The current PlotData
 * @param indicatorMetadata Metadata for currently selected indicator
 * @param disaggregateId ID of the selected disaggregate
 * @param xAxisId ID of the selected x-axis
 * @param areaLevel The current area level
 * @param disaggregateSelections The selected options for the disaggregate control
 * @param xAxisSelections The selected options for the x-axis control
 * @param xAxisOptions The available options for the x-axis control. We need this as we want
 *   to show the x-axis in the same order as the options are in the dropdown
 * @param areaIdToPropertiesMap Mapping of area IDs to area levels
 * @return Data required for chartJS. This includes:
 *   labels - array of labels for the x-axis
 *   datasets - array of datasets, each of them represents a bar in the barchart, with a label, a colour,
 *     the data values themselves and error bars
 *   maxValuePlusError - value for the highest value in the barchart + error, used for the height of the plot
 */
export const plotDataToChartData = function (plotData: PlotData,
                                             indicatorMetadata: IndicatorMetadata,
                                             disaggregateId: string,
                                             disaggregateSelections: FilterOption[],
                                             xAxisId: string,
                                             xAxisSelections: FilterOption[],
                                             xAxisOptions: FilterOption[],
                                             areaLevel: string | undefined | null,
                                             areaIdToPropertiesMap: Dict<AreaProperties>): BarChartData {

    const disaggregateSelectionsMap: Dict<string> = disaggregateSelections.reduce(
        (map: Dict<string>, opt: FilterOption) => {
            map[opt.id] = opt.label;
            return map;
        }, {});
    const visibleXAxis = xAxisSelections.filter(opt => {
        if (xAxisId === "area_id") {
            // If it is x-axis filtered on area we also want to include the area level
            // in the filtering of the x-axis
            const level = areaIdToPropertiesMap[opt.id].area_level;
            return level.toString() === areaLevel
        } else {
            return true
        }
    });
    const xAxisOrdering = xAxisOptions.map(opt => opt.id)
    visibleXAxis.sort((a, b) => xAxisOrdering.indexOf(a.id) - xAxisOrdering.indexOf(b.id));
    const orderedXAxisLabels = visibleXAxis.map(opt => opt.label);

    let maxValuePlusError = 0;
    const datasets: ChartDataSetsWithErrors[] = [];

    let colorIdx = 0;
    for (const row of plotData as any) {
        const datasetValue = row[disaggregateId];
        const datasetLabel = disaggregateSelectionsMap[datasetValue];

        const xAxisValue = row[xAxisId];
        const xAxisLabel = visibleXAxis.find(opt => opt.id == xAxisValue)?.label || "";
        if (!xAxisLabel) {
            // If the label isn't in the list of labels which should be visible
            // then ignore it
            continue;
        }

        let dataset = datasets.filter(d => (d as any).label == datasetLabel)[0] || null;
        if (!dataset) {
            dataset = initialBarChartDataset(datasetLabel, colors[colorIdx])
            datasets.push(dataset);
            colorIdx++;
        }

        const value = row[indicatorMetadata.value_column];

        if (!value) {
            continue;
        }

        // Ensure bars displayed on x-axis in same order as we show them in the dropdown
        const labelIdx = orderedXAxisLabels.indexOf(xAxisLabel);
        while (dataset.data.length <= labelIdx) {
            dataset.data.push(0);
        }
        dataset.data[labelIdx] = value;

        dataset.errorBars![xAxisLabel] = { minus: undefined, plus: undefined };
        if (indicatorMetadata.error_high_column && indicatorMetadata.error_low_column) {
            if (row[indicatorMetadata.error_high_column] > maxValuePlusError) {
                maxValuePlusError = row[indicatorMetadata.error_high_column]
            }

            dataset.errorBars![xAxisLabel].plus = row[indicatorMetadata.error_high_column];
            dataset.errorBars![xAxisLabel].minus = row[indicatorMetadata.error_low_column];
        }
    }

    return {
        maxValuePlusError,
        labels: orderedXAxisLabels,
        datasets
    }
};

const pushDatasetValue = (idx: number, dataset: any, value: number | null, tooltip: string) => {
    while (dataset.data.length <= idx) {
        dataset.data.push(0);
        dataset.tooltipExtraText.push("");
    }
    dataset.data[idx] = value;
    dataset.tooltipExtraText[idx] = tooltip;
}

export const inputComparisonPlotDataToChartData = function (plotData: InputComparisonPlotData,
                                                            indicatorMetadata: IndicatorMetadata,
                                                            xAxisId: string,
                                                            xAxisSelections: FilterOption[],
                                                            xAxisOptions: FilterOption[],
                                                            currentLanguage: string): BarChartData {

    const xAxisOrdering = xAxisOptions.map(opt => opt.id)
    xAxisSelections.sort((a, b) => xAxisOrdering.indexOf(a.id) - xAxisOrdering.indexOf(b.id));
    const orderedXAxisLabels = xAxisSelections.map(opt => opt.label);

    const datasets: ChartDataSetsWithErrors[] = [
        initialBarChartDataset("Naomi", colors[0]),
        initialBarChartDataset("Spectrum", colors[1]),
    ];

    const formatCallback = getNumberFormatCallback(indicatorMetadata, false)

    for (const row of plotData) {

        const xAxisValue = row[xAxisId];
        const xAxisLabel = xAxisSelections.find(opt => opt.id == xAxisValue)?.label || "";
        if (!xAxisLabel) {
            // If the label isn't in the list of labels which should be visible
            // then ignore it
            continue;
        }

        // ANC data has keys "value_spectrum" but ART data has keys "value_spectrum_reported"
        // and "value_spectrum_adjusted", use the reported value for ART data
        let spectrumValue = row["value_spectrum"]
        if (!spectrumValue) {
            spectrumValue = row["value_spectrum_reported"] ?? null
        }
        const naomiValue = row["value_naomi"]
        const difference = spectrumValue && naomiValue ? spectrumValue - naomiValue : null
        const naomiValueTooltip = difference !== null ? i18next.t("inputComparisonTooltipDifferenceNaomi", {
            difference: formatCallback(-difference),
            lng: currentLanguage
        }) : "";
        const spectrumValueTooltip = difference !== null ? i18next.t("inputComparisonTooltipDifferenceSpectrum", {
            difference: formatCallback(difference),
            lng: currentLanguage
        }) : "";

        const labelIdx = orderedXAxisLabels.indexOf(xAxisLabel);
        pushDatasetValue(labelIdx, datasets[0], naomiValue, naomiValueTooltip);
        pushDatasetValue(labelIdx, datasets[1], spectrumValue, spectrumValueTooltip);
    }

    return {
        maxValuePlusError: 0,
        labels: orderedXAxisLabels,
        datasets
    }
};

export const getErrorLineAnnotations = function(chartData: BarChartData,
                                                displayErrorBars: boolean,
                                                showLabelErrorBars: boolean[]): AnnotationOptions[] {
    // amount of padding chart js uses by default for each bar
    const barPercentage = 0.8;

    const { datasets, labels } = chartData;
    const errorLines: AnnotationOptions[] = [];

    // the errorBars need to coordinate with what bar charts are visible
    // in chart js (users can click legend to hide certain bars)
    const visibleDatasetIndices = showLabelErrorBars.reduce(
        (out: number[], bool: boolean, index: number) => bool ? out.concat(index) : out,
        []
    );

    const numOfDatasets = showLabelErrorBars.filter(x => x).length;
    const numOfLabels = labels?.length ?? 0;
    const numOfBars = numOfDatasets * numOfLabels;

    const halfBarWidth = barPercentage / (numOfDatasets * 2);

    visibleDatasetIndices.forEach((datasetId, indexDataset) => {
        const dataset = datasets[datasetId];
        if (!dataset) {
            return
        }
        const errorBarData = dataset.errorBars;
        if (!errorBarData) return;

        const label = dataset.label || "";
        Object.keys(errorBarData).forEach((xLabel) => {
            const labelIndex = labels?.indexOf(xLabel)
            if (labelIndex === undefined) {
                return;
            }
            const barMidPoint = labelIndex + halfBarWidth * (indexDataset * 2 + 1) - barPercentage / 2;

            /*
                This is the width of the horizontal bits on top and bottom of the error
                bars. This formula address the problem of error bars being too wide
                when there is only one or two bars on the chart. If we just set it to
                a constant halfBarWidth * 0.3 then it is too big when there are a few
                wide bars on the screen.

                So when there are a few wide bars, numOfBars/(numOfBars + 10) is small
                which solves our problem. When there are a lot of thin bars
                numOfBars/(numOfBars + 10) is closer to 1 so we don't get very small
                error bar widths
            */
            const errorBarWidth = (numOfBars / (numOfBars + 10)) * halfBarWidth * 0.3;

            const { minus, plus } = errorBarData[xLabel];
            if (minus && plus) {
                errorLines.push(getErrorLineConfig(
                    label,
                    barMidPoint,
                    barMidPoint,
                    minus,
                    plus,
                    displayErrorBars
                ));
                errorLines.push(getErrorLineConfig(
                    label,
                    barMidPoint - errorBarWidth,
                    barMidPoint + errorBarWidth,
                    plus,
                    plus,
                    displayErrorBars
                ));
                errorLines.push(getErrorLineConfig(
                    label,
                    barMidPoint - errorBarWidth,
                    barMidPoint + errorBarWidth,
                    minus,
                    minus,
                    displayErrorBars
                ));
            }
        })
    })
    return errorLines;
}

const getErrorLineConfig = function(
    label: string,
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number,
    display: boolean
): AnnotationOptions {
    return {
        borderColor: "#585858",
        drawTime: "afterDatasetsDraw",
        type: "line",
        label: {
            content: label
        },
        display,
        xMin,
        xMax,
        yMin,
        yMax,
        borderWidth: 1
    }
}

const getNumberFormatCallback = function(indicatorMetadata: IndicatorMetadata, absoluteValue: boolean) {
    return (value: number | string) => {
        return formatOutput(value,
            indicatorMetadata.format,
            indicatorMetadata.scale,
            indicatorMetadata.accuracy,
            true,
            absoluteValue)
    }
}

export const buildTooltipCallback = function(indicatorMetadata: IndicatorMetadata, showErrorRange: boolean, absoluteValue = false) {
    const formatCallback = getNumberFormatCallback(indicatorMetadata, absoluteValue)

    // See https://www.chartjs.org/docs/latest/configuration/tooltip.html#tooltip-item-context for items
    // available on context
    return (context: any) => {
        const {
            datasetIndex,
            dataset,
            raw: yLabel,
            label: xLabel
        } = context;
        let label = ((typeof datasetIndex !== "undefined") && dataset && dataset.label) || '';
        if (label) {
            label += ': ';
        }

        if (yLabel) {
            label += formatCallback(yLabel);
        }

        let minus = null
        let plus = null

        if (showErrorRange && xLabel && typeof datasetIndex !== "undefined" && dataset) {
            const errorBars = (dataset as ChartDataSetsWithErrors).errorBars
            const xLabelErrorBars = errorBars ? errorBars[xLabel] : null
            if (xLabelErrorBars) {
                minus = xLabelErrorBars.minus
                plus = xLabelErrorBars.plus
            }
        }

        if ((typeof minus === "number") && (typeof plus === "number")) {
            label = `${label} (${formatCallback(minus)} - ${formatCallback(plus)})`
        }

        return label;
    }
}

const initialBarChartDataset = (datasetLabel: string, backgroundColor: string): ChartDataSetsWithErrors => {
    return {
        label: datasetLabel,
        backgroundColor,
        data: [],
        maxBarThickness: 175,
        errorBars: {},
        tooltipExtraText: []
    }
};

export const sortDatasets = (datasets: ChartDataSetsWithErrors[], disaggregateSelections: FilterOption[], order: string[]) => {
    const labelIdxMap = new Map<string, number>();
    order.forEach((id: string, index) => {
        const filterOpt = disaggregateSelections.find((opt: FilterOption) => opt.id === id)
        if (filterOpt?.label) labelIdxMap.set(filterOpt.label, index)
    });

    const getLabelIndex = (label?: string): number => labelIdxMap.get(label ?? "") ?? Infinity;

    datasets.sort((a: ChartDataSetsWithErrors, b: ChartDataSetsWithErrors) => {
        return getLabelIndex(a.label) - getLabelIndex(b.label);
    });
}

const colors = [
    //d3 chromatic schemeSet1
    '#e41a1c',
    '#377eb8',
    '#4daf4a',
    '#984ea3',
    '#ff7f00',
    '#ffff33',
    '#a65628',
    '#f781bf',
    '#999999',
    //d3 chromatic schemeDark2
    '#1b9e77',
    '#d95f02',
    '#7570b3',
    '#e7298a',
    '#66a61e',
    '#e6ab02',
    '#a6761d',
    '#666666',
    //d3 chromatic schemeCategory10
    '#1f77b4',
    '#ff7f0e',
    '#2ca02c',
    '#d62728',
    '#9467bd',
    '#8c564b',
    '#e377c2',
    '#7f7f7f',
    '#bcbd22',
    '#17becf',
    //d3 chromatic schemeTableau10
    '#4e79a7',
    '#f28e2c',
    '#e15759',
    '#76b7b2',
    '#59a14f',
    '#edc949',
    '#af7aa1',
    '#ff9da7',
    '#9c755f',
    '#bab0ab'
];
