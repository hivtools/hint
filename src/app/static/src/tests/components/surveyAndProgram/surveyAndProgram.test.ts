import {testUploadComponent} from "./fileUploads";
import {createLocalVue, shallowMount} from '@vue/test-utils';
import Vue from 'vue';
import Vuex from 'vuex';
import SurveyAndProgram from "../../../app/components/surveyAndProgram/SurveyAndProgram.vue";
import {mockSurveyAndProgramState} from "../../mocks";

const localVue = createLocalVue();
Vue.use(Vuex);

describe("Survey and program component", () => {

    testUploadComponent("surveys", 0);
    testUploadComponent("program", 1);
    testUploadComponent("anc", 2);

    it("renders filters", () => {
        const store = new Vuex.Store({
            modules: {
                surveyAndProgram: {
                    namespaced: true,
                    state: mockSurveyAndProgramState()
                }
            }
        });

        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});

        expect(wrapper.findAll("filters-stub").length).toBe(1);
    });
});

