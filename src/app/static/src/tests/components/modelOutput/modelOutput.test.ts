import {createLocalVue, shallowMount} from '@vue/test-utils';
import Vue from 'vue';
import Vuex from 'vuex';
import ModelOutput from "../../../app/components/modelOutput/ModelOutput.vue";
import {
    mockAncResponse,
    mockFilteredDataState,
    mockProgramResponse,
    mockSurveyAndProgramState,
    mockSurveyResponse
} from "../../mocks";
import {SurveyAndProgramDataState} from "../../../app/store/surveyAndProgram/surveyAndProgram";
import {DataType, FilteredDataState} from "../../../app/store/filteredData/filteredData";
import {actions} from "../../../app/store/filteredData/actions";
import {mutations} from "../../../app/store/filteredData/mutations";

const localVue = createLocalVue();
Vue.use(Vuex);

function getStore() {
    return new Vuex.Store({
        modules: {
            filteredData: {
                namespaced: true,
                state: mockFilteredDataState(),
                actions: actions,
                mutations: mutations
            }
        }
    });
}

describe("ModelOutput component", () => {
    it("renders choropleth and choropleth filters", () => {
        const store = getStore();
        const wrapper = shallowMount(ModelOutput, {localVue, store});

        expect(wrapper.findAll("choropleth-filters-stub").length).toBe(1);
        expect(wrapper.findAll("choropleth-stub").length).toBe(1);
    });

    it("sets selectedDataType to Output", () => {
        const store = getStore();
        const wrapper = shallowMount(ModelOutput, {localVue, store});

        expect(store.state.filteredData.selectedDataType).toBe(DataType.Output);
    });
});