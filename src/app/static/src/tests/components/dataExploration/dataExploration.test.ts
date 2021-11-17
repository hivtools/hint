import {shallowMount} from "@vue/test-utils";
import DataExploration from "../../../app/components/dataExploration/DataExploration.vue"
import Vuex from "vuex";
import {emptyState} from "../../../app/root";
import {
    mockBaselineState,
    mockSurveyAndProgramState
} from "../../mocks";
import {getters} from "../../../app/store/surveyAndProgram/getters";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {BaselineActions} from "../../../app/store/baseline/actions";
import {SurveyAndProgramActions} from "../../../app/store/surveyAndProgram/actions";
import {BaselineState} from "../../../app/store/baseline/baseline";
import {DataType, SurveyAndProgramState} from "../../../app/store/surveyAndProgram/surveyAndProgram";

describe(`data exploration component`, () => {
    let actions: jest.Mocked<BaselineActions>;
    let mutations = {};

    let sapActions: jest.Mocked<SurveyAndProgramActions>;
    let sapMutations = {};

    const createSut = (baselineState?: Partial<BaselineState>,
                       surveyAndProgramState: Partial<SurveyAndProgramState> = {selectedDataType: DataType.Survey}) => {

        actions = {
            refreshDatasetMetadata: jest.fn(),
            importPJNZ: jest.fn(),
            importPopulation: jest.fn(),
            importShape: jest.fn(),
            getBaselineData: jest.fn(),
            uploadPJNZ: jest.fn(),
            uploadShape: jest.fn(),
            uploadPopulation: jest.fn(),
            deletePJNZ: jest.fn(),
            deleteShape: jest.fn(),
            deletePopulation: jest.fn(),
            deleteAll: jest.fn(),
            validate: jest.fn()
        };

        const store = new Vuex.Store({
            state: emptyState(),
            modules: {
                baseline: {
                    namespaced: true,
                    state: mockBaselineState(baselineState),
                    actions: {...actions},
                    mutations: {...mutations}
                },
                surveyAndProgram: {
                    namespaced: true,
                    state: mockSurveyAndProgramState(surveyAndProgramState),
                    mutations: {...sapMutations},
                    actions: {...sapActions},
                    getters: getters
                }
            }
        });

        registerTranslations(store);
        return store;
    };

    it(`renders components as expect`, () => {
        const store = createSut()
        const wrapper = shallowMount(DataExploration, {store});
        expect(wrapper.find("adr-integration-stub").exists()).toBe(true)
        expect(wrapper.find("upload-inputs-stub").exists()).toBe(true)
        expect(wrapper.findAll("stepper-navigation-stub").exists()).toBe(true)
    })

    it(`disables back navigation when on upload step`, () => {
        const store = createSut()
        const wrapper = shallowMount(DataExploration, {store});
        expect(wrapper.find("stepper-navigation-stub").props("backDisabled")).toBe(true)
        expect(wrapper.find("stepper-navigation-stub").props("nextDisabled")).toBe(false)
    })

    it(`disables continue navigation when on review step`, () => {
        const store = createSut()
        const wrapper = shallowMount(DataExploration, {
            store,
            data() {
                return {step: 2}
            }
        });

        expect(wrapper.find("stepper-navigation-stub").props("backDisabled")).toBe(false)
        expect(wrapper.find("stepper-navigation-stub").props("nextDisabled")).toBe(true)
    })

    it(`continue button can navigate to reviewInputs`, () => {
        const store = createSut()
        const wrapper = shallowMount(DataExploration, {store});
        expect(wrapper.find("review-inputs-stub").exists()).toBe(false)
        const vm = wrapper.vm as any
        vm.next()
        expect(wrapper.find("review-inputs-stub").exists()).toBe(true)
    })

    it(`back button can navigate to uploadInputs`, () => {
        const store = createSut()
        const wrapper = shallowMount(DataExploration, {
            store,
            data() {
                return {step: 2}
            }
        });

        expect(wrapper.find("upload-inputs-stub").exists()).toBe(false)
        const vm = wrapper.vm as any
        vm.back()
        expect(wrapper.find("upload-inputs-stub").exists()).toBe(true)
    })

});