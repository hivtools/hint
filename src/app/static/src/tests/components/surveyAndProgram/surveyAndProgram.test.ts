import {testUploadComponent} from "./fileUploads";
import {createLocalVue, shallowMount} from '@vue/test-utils';
import Vue from 'vue';
import Vuex from 'vuex';
import SurveyAndProgram from "../../../app/components/surveyAndProgram/SurveyAndProgram.vue";
import {mockFilteredDataState, mockSurveyAndProgramState} from "../../mocks";
import {DataType} from "../../../app/store/filteredData/filteredData";

const localVue = createLocalVue();
Vue.use(Vuex);

describe("Survey and program component", () => {

    testUploadComponent("surveys", 0);
    testUploadComponent("program", 1);
    testUploadComponent("anc", 2);

    it("renders filters and map if there is a selected data type", () => {
        const store = new Vuex.Store({
            modules: {
                surveyAndProgram: {
                    namespaced: true,
                    state: mockSurveyAndProgramState(),

                },
                filteredData: {
                    namespaced: true,
                    state: mockFilteredDataState({selectedDataType: DataType.Survey})
                }
            }
        });

        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});

        expect(wrapper.findAll("filters-stub").length).toBe(1);
        expect(wrapper.findAll("choropleth-stub").length).toBe(1);
    });

    it("does not render filters and map if there is no selected data type", () => {
        const store = new Vuex.Store({
            modules: {
                surveyAndProgram: {
                    namespaced: true,
                    state: mockSurveyAndProgramState(),

                },
                filteredData: {
                    namespaced: true,
                    state: mockFilteredDataState({selectedDataType: null})
                }
            }
        });

        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});

        expect(wrapper.findAll("filters-stub").length).toBe(0);
        expect(wrapper.findAll("choropleth-stub").length).toBe(0);
    });
});

