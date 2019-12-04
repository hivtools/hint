import {BarchartIndicator, Dict, Filter} from "../../../types";
import {FilterOption} from "../../../generated";

export const toFilterLabelLookup = (array: Filter[]) =>
    array.reduce((obj, current) => {
        obj[current.id] = current.label;
        return obj
    }, {} as Dict<string>);

export const getProcessedOutputData = (data: any[],
                                       xAxis: string,
                                       disaggBy: string,
                                       indicator: BarchartIndicator,
                                       filters: Filter[],
                                       selectedFilterValues: { [key: string]: FilterOption[] },
                                       barLabelLookup: Dict<string>,
                                       xAxisLabelLookup: Dict<string>,
                                       xAxisLabels: string[],
                                       xAxisValues: string[]) => {

    const datasets: any[] = [];

    const disaggByColumn = filters.find((f: FilterOption) => f.id == disaggBy)!!.column_id;
    const xAxisColumn = filters.find((f: FilterOption) => f.id == xAxis)!!.column_id;

    let colorIdx = 0;
    for (const r of data) {
        const row = r as any;

        //filter by indicator
        if (row[indicator.indicator_column] != indicator.indicator_value) {
            continue;
        }

        //filter by other filters
        let filterRow = false;
        for (const filter of filters) {
            const filterValues = selectedFilterValues[filter.id].map(n => n.id);
            if (filterValues.indexOf(row[filter.column_id].toString()) < 0) {
                filterRow = true;
                break;
            }
        }
        if (filterRow) {
            continue;
        }

        const datasetValue = row[disaggByColumn];
        const datasetLabel = barLabelLookup[datasetValue];

        //filter out unknown disaggregations e.g regions at levels we're not showing
        if (datasetLabel === undefined) {
            continue;
        }

        const xAxisValue = row[xAxisColumn];
        const xAxisLabel = xAxisLabelLookup[xAxisValue];

        let dataset = datasets.filter(d => (d as any).label == datasetLabel)[0] || null;
        if (!dataset) {
            dataset = {
                label: datasetLabel,
                backgroundColor: colors[colorIdx],
                data: [],
                errorBars: {}
            };
            datasets.push(dataset);
            colorIdx++;
        }

        const value = row[indicator.value_column];

        if (value == undefined) {
            continue;
        }

        const valueIdx = xAxisValues.indexOf(xAxisValue.toString());
        while (dataset.data.length <= valueIdx) {
            dataset.data.push(0);
        }
        dataset.data[valueIdx] = value;

        dataset.errorBars[xAxisLabel] = {};
        dataset.errorBars[xAxisLabel].plus = row[indicator.error_high_column];
        dataset.errorBars[xAxisLabel].minus = row[indicator.error_low_column];
    }

    return {
        labels: xAxisLabels,
        datasets
    }
};

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
