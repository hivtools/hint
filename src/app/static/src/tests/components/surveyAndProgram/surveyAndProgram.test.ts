import {testUploadComponent} from "./fileUploads";
import {createLocalVue, shallowMount} from '@vue/test-utils';
import Vue from 'vue';
import Vuex from 'vuex';
import SurveyAndProgram from "../../../app/components/surveyAndProgram/SurveyAndProgram.vue";
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

describe("Survey and program component", () => {

    testUploadComponent("surveys", 0);
    testUploadComponent("program", 1);
    testUploadComponent("anc", 2);

    const createStore = (surveyAndProgramState: Partial<SurveyAndProgramDataState> = {},
                         filteredDataState: Partial<FilteredDataState> = {}) => {
        return new Vuex.Store({
            modules: {
                surveyAndProgram: {
                    namespaced: true,
                    state: mockSurveyAndProgramState(surveyAndProgramState)
                },
                filteredData: {
                    namespaced: true,
                    state: mockFilteredDataState(filteredDataState),
                    actions: actions,
                    mutations: mutations
                }
            }
        });
    };

    it("renders filters", () => {
        const wrapper = shallowMount(SurveyAndProgram, {store: createStore(), localVue});
        expect(wrapper.findAll("filters-stub").length).toBe(1);
    });

    it("tabs are disabled if no data is present", () => {
        const wrapper = shallowMount(SurveyAndProgram, {store: createStore(), localVue});
        expect(wrapper.findAll(".nav-item").length).toBe(3);
        expect(wrapper.findAll(".nav-item .nav-link.disabled").length).toBe(3);
    });

    it("survey tab is enabled when survey data is present", () => {
        expectTabEnabled({survey: mockSurveyResponse()}, "Survey", 0);
    });

    it("programme tab is enabled when program data is present", () => {
        expectTabEnabled({program: mockProgramResponse()}, "Programme", 1);
    });

    it("ANC tab is enabled when ANC data is present", () => {
        expectTabEnabled({anc: mockAncResponse()}, "ANC", 2);
    });

    function expectTabEnabled(state: Partial<SurveyAndProgramDataState>, name: string, index: number) {
        const store = createStore(state);
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});
        expect(wrapper.findAll(".nav-link").at(index).classes()).not.toContain("disabled");
        expect(wrapper.findAll(".nav-link").at(index).text()).toBe(name);
        expect(wrapper.findAll(".nav-link.disabled").length).toBe(2);
    }

    it("can change tabs", () => {
        const store = createStore(
            {
                anc: mockAncResponse(),
                survey: mockSurveyResponse(),
                program: mockProgramResponse()
            },
            {
                selectedDataType: DataType.Program
            });
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});
        expect(wrapper.find(".nav-link.active").text()).toBe("Programme");

        wrapper.findAll(".nav-link").at(2).trigger("click");
        Vue.nextTick();
        expect(wrapper.find(".nav-link.active").text()).toBe("ANC");

        wrapper.findAll(".nav-link").at(0).trigger("click");
        Vue.nextTick();
        expect(wrapper.find(".nav-link.active").text()).toBe("Survey");

        wrapper.findAll(".nav-link").at(1).trigger("click");
        Vue.nextTick();
        expect(wrapper.find(".nav-link.active").text()).toBe("Programme");

    });

});

