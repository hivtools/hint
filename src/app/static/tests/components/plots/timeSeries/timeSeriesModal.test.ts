import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import TimeSeriesModal from '../../../../src/components/plots/timeSeries/TimeSeriesModal.vue';
import Modal from '../../../../src/components/Modal.vue';
import Plotly from '../../../../src/components/plots/timeSeries/Plotly.vue';
import TimeSeriesLegend from '../../../../src/components/plots/timeSeries/TimeSeriesLegend.vue';
import Equation from '../../../../src/components/common/Equation.vue';
import Vuex, {Store} from 'vuex';
import {RootState} from "../../../../src/root";
import {mockMetadataState, mockReviewInputDataset, mockReviewInputMetadata, mockReviewInputState} from "../../../mocks";
import {PlotSelectionsState} from "../../../../src/store/plotSelections/plotSelections";
import {InputTimeSeriesData} from "../../../../src/generated";
import {ReviewInputDataColumnValue} from "../../../../src/types";

describe('Time series modal works as expected', () => {
    const inputData = [
        {
            "area_id": "area-1",
            "area_name": "Chitipa",
            "area_hierarchy": "Northern/Chitipa",
            "area_level": 4,
            "quarter": "Q4",
            "time_period": "2011 Q4",
            "plot": "anc_status",
            "value": 2116,
            "page": 1
        },
        {
            "area_id": "area-1",
            "area_name": "Chitipa",
            "area_hierarchy": "Northern/Chitipa",
            "area_level": 4,
            "quarter": "Q4",
            "time_period": "2012 Q4",
            "plot": "anc_status",
            "value": 2663,
            "page": 1
        },
        {
            "area_id": "area-1",
            "area_name": "Chitipa",
            "area_hierarchy": "Northern/Chitipa",
            "area_level": 4,
            "quarter": "Q4",
            "time_period": "2011 Q4",
            "plot": "anc_total_pos",
            "value": 4555,
            "page": 1
        },
        {
            "area_id": "area-1",
            "area_name": "Chitipa",
            "area_hierarchy": "Northern/Chitipa",
            "area_level": 4,
            "quarter": "Q4",
            "time_period": "2012 Q4",
            "plot": "anc_total_pos",
            "value": 4795,
            "page": 1
        },
        {
            "area_id": "area-1",
            "area_name": "Chitipa",
            "area_hierarchy": "Northern/Chitipa",
            "area_level": 4,
            "quarter": "Q4",
            "time_period": "2011 Q4",
            "plot": "new_plot_type",
            "value": 2116,
            "page": 1
        },
        {
            "area_id": "area-2",
            "area_name": "Other",
            "area_hierarchy": "Northern/Other",
            "area_level": 4,
            "quarter": "Q4",
            "time_period": "2012 Q4",
            "plot": "anc_total_pos",
            "value": 4795,
            "page": 1
        },
    ] as any as InputTimeSeriesData;

    const areaIdToPropertiesMap = {
        'area-1': { area_name: 'Area One' },
        'area-2': { area_name: 'Area Two' }
    }

    const timeSeriesPlotTypeLabels = new Map<string, string>([
        ["plot-1", "Plot 1"],
        ["plot-2", "Plot 2"],
        ["anc_prevalence", "ANC prev"],
        ["anc_total_pos", "ANC total pos"],
        ["anc_status", "ANC status"],
        ["anc_known_pos", "ANC known pos"],
        ["anc_tested_pos", "ANC tested pos"],
        ["anc_tested", "ANC tested"],
        ["anc_known_neg", "ANC known neg"]
    ]);

    const getters = {
        'baseline/areaIdToPropertiesMap': () => areaIdToPropertiesMap,
        'metadata/timeSeriesPlotTypeLabel': () => timeSeriesPlotTypeLabels
    };


    const getStore = (inputData: InputTimeSeriesData): Store<Partial<RootState>> => {
        const state: Partial<RootState> = {
            plotSelections: {
                timeSeries: {
                    filters: [
                        {
                            filterId: 'plotType',
                            stateFilterId: 'plotType',
                            label: 'Plot',
                            selection: [
                                {id: 'anc_status', label: 'ANC status'},
                                {id: 'anc_total_pos', label: 'ANC total pos'}
                            ]
                        }
                    ],
                    controls: [
                        {id: 'time_series_data_source', label: 'Data source', selection: [{id: 'dataSource-1', label: "data source"}]},
                    ],
                },
            } as any as PlotSelectionsState,
            reviewInput: mockReviewInputState({
                datasets: {
                    'dataSource-1': mockReviewInputDataset({
                        data: inputData
                    }),
                },
            }),
            metadata: mockMetadataState({
                reviewInputMetadata: mockReviewInputMetadata({
                    filterTypes: [
                        {
                            id: 'plotType',
                            column_id: 'plot',
                            options: [
                                {id: 'anc_status', label: 'ANC status', format: "0.0%"},
                                {id: 'anc_total_pos', label: 'ANC total pos', format: "0,0"},
                                {id: 'anc_known_neg', label: 'ANC known neg'},
                                {id: 'anc_known_pos', label: 'ANC known pos'},
                                {id: 'anc_tested_pos', label: 'ANC tested pos'},
                                {id: 'anc_tested', label: 'ANC tested'},
                                {id: 'anc_prevalence', label: 'ANC prevalence'},
                            ] as ReviewInputDataColumnValue[],
                        },
                    ],
                })
            })
        };

        return new Vuex.Store({
            state: state,
            getters: getters
        });
    }
    const mockStore = getStore(inputData);

    const getWrapper = (props: any, store = mockStore) => {
        return mount(TimeSeriesModal, {
            props,
            global: {
                components: { Modal, Plotly, TimeSeriesLegend, Equation },
                plugins: [store],
            },
        });
    };

    it('renders the modal with correct header', () => {
        const wrapper = getWrapper({ openModal: true, areaId: 'area-1', plotType: 'anc_prevalence' });

        expect(wrapper.find('h4').text()).toBe('Area One (area-1)');
    });

    it('renders TimeSeriesLegend and Plotly when chartData is not empty', async () => {
        const wrapper = getWrapper({ openModal: true, areaId: 'area-1', plotType: 'anc_prevalence' });

        expect(wrapper.findComponent(TimeSeriesLegend).exists()).toBe(true);
        expect(wrapper.findComponent(Plotly).exists()).toBe(true);
    });

    it('does not render TimeSeriesLegend and Plotly when chartData is empty', async () => {
        const store = getStore([])
        const wrapper = getWrapper({ openModal: true, areaId: 'area-1', plotType: 'anc_prevalence' }, store);

        expect(wrapper.findComponent(TimeSeriesLegend).exists()).toBe(false);
        expect(wrapper.findComponent(Plotly).exists()).toBe(false);
    });

    it('emits close-modal event when modal close is triggered', () => {
        const wrapper = getWrapper({ openModal: true, areaId: 'area-1', plotType: 'anc_prevalence' });

        wrapper.findComponent(Modal).vm.$emit('close-modal');
        expect(wrapper.emitted('close-modal')).toBeTruthy();
    });

    it('renders the equation with correct formula', () => {
        const wrapper = getWrapper({ openModal: true, areaId: 'area-1', plotType: 'anc_prevalence' });

        expect(wrapper.findComponent(Equation).exists()).toBe(true);
        expect((wrapper.findComponent(Equation).props() as any).formula).toMatch('\\textcolor');
    });

    it('computes chartData correctly', () => {
        const wrapper = getWrapper({ openModal: true, areaId: 'area-1', plotType: 'anc_prevalence' });

        const vm = wrapper.vm as any;
        expect(vm.chartData).toEqual(inputData.slice(0, 4));
    });

    it('computes valueFormats correctly', () => {
        const wrapper = getWrapper({ openModal: true, areaId: 'area-1', plotType: 'anc_prevalence' });

        const vm = wrapper.vm as any;
        expect(vm.valueFormats).toEqual(['', ',', '.1%', '', '', '', '']);
    });
});
