import {testUploadComponent} from "./fileUploads";
import {createLocalVue, shallowMount} from '@vue/test-utils';
import Vue from 'vue';
import Vuex from 'vuex';
import SurveyAndProgram from "../../../app/components/surveyAndProgram/SurveyAndProgram.vue";
import {
    mockAncResponse,
    mockBaselineState,
    mockProgramResponse,
    mockSurveyAndProgramState,
    mockSurveyResponse
} from "../../mocks";
import {DataType, SurveyAndProgramState} from "../../../app/store/surveyAndProgram/surveyAndProgram";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {emptyState} from "../../../app/root";
import {actions} from "../../../app/store/surveyAndProgram/actions";
import {mutations} from "../../../app/store/surveyAndProgram/mutations";

const localVue = createLocalVue();

describe("Survey and programme component", () => {

    testUploadComponent("surveys", 0);
    testUploadComponent("program", 1);
    testUploadComponent("anc", 2);

    const createStore = (surveyAndProgramState: Partial<SurveyAndProgramState> = {selectedDataType: DataType.Survey}) => {
        const store = new Vuex.Store({
            state: emptyState(),
            modules: {
                surveyAndProgram: {
                    namespaced: true,
                    state: mockSurveyAndProgramState(surveyAndProgramState),
                    mutations: mutations,
                    actions: actions
                },
                baseline: {
                    namespaced: true,
                    state: mockBaselineState()
                }
            }
        });
        registerTranslations(store);
        return store;
    };

    it("show choropleth controls if there is a selected data type", () => {
        const store = createStore({selectedDataType: DataType.Survey});
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});

        expect(wrapper.find("choropleth-stub").props().hideControls).toBe(false);
    });

    it("hides choropleth controls if there is no selected data type", () => {
        const store = createStore({selectedDataType: null});
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});

        expect(wrapper.find("choropleth-stub").props().hideControls).toBe(true);
    });

    it("tabs are disabled if no data is present", () => {
        const wrapper = shallowMount(SurveyAndProgram, {store: createStore(), localVue});
        expect(wrapper.findAll(".nav-item").length).toBe(3);
        expect(wrapper.findAll(".nav-item .nav-link.disabled").length).toBe(3);
    });

    it("survey tab is enabled when survey data is present", () => {
        expectTabEnabled({survey: mockSurveyResponse(), selectedDataType: DataType.Survey}, "Survey", 0);
    });

    it("programme (ART) tab is enabled when programme data is present", () => {
        expectTabEnabled({program: mockProgramResponse(), selectedDataType: DataType.Survey}, "ART", 1);
    });

    it("ANC tab is enabled when ANC data is present", () => {
        expectTabEnabled({anc: mockAncResponse(), selectedDataType: DataType.Survey}, "ANC", 2);
    });

    function expectTabEnabled(state: Partial<SurveyAndProgramState>, name: string, index: number) {
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
                program: mockProgramResponse(),
                selectedDataType: DataType.Program
            });
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});
        expect(wrapper.find(".nav-link.active").text()).toBe("ART");

        wrapper.findAll(".nav-link").at(2).trigger("click");
        Vue.nextTick();
        expect(wrapper.find(".nav-link.active").text()).toBe("ANC");

        wrapper.findAll(".nav-link").at(0).trigger("click");
        Vue.nextTick();
        expect(wrapper.find(".nav-link.active").text()).toBe("Survey");

        wrapper.findAll(".nav-link").at(1).trigger("click");
        Vue.nextTick();
        expect(wrapper.find(".nav-link.active").text()).toBe("ART");

        expect(wrapper.findAll("choropleth-stub").length).toBe(1);
    });

});

