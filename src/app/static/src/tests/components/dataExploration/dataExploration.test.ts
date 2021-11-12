import {shallowMount} from "@vue/test-utils";
import DataExploration from "../../../app/components/dataExploration/DataExploration.vue"
import Vuex from "vuex";
import {emptyState} from "../../../app/root";
import {mockBaselineState, mockSurveyAndProgramState} from "../../mocks";
import {getters} from "../../../app/store/surveyAndProgram/getters";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {BaselineActions} from "../../../app/store/baseline/actions";
import {SurveyAndProgramActions} from "../../../app/store/surveyAndProgram/actions";
import {testUploadComponent} from "../baseline/fileUploads";
import {BaselineState} from "../../../app/store/baseline/baseline";
import {DataType, SurveyAndProgramState} from "../../../app/store/surveyAndProgram/surveyAndProgram";
import {expectTranslatedWithStoreType} from "../../testHelpers";

describe(`data exploration component`, () => {
    let actions: jest.Mocked<BaselineActions>;
    let mutations = {};

    let sapActions: jest.Mocked<SurveyAndProgramActions>;
    let sapMutations = {};

    testUploadComponent("surveys", 3);
    testUploadComponent("program", 4);
    testUploadComponent("anc", 5);

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
        expect(wrapper.find("baseline-stub").exists()).toBe(true)
        expect(wrapper.findAll("button").length).toBe(2)
    })

    it(`can translate button texts`, () => {
        const store = createSut()
        const wrapper = shallowMount(DataExploration, {store});
        expect(wrapper.findAll("button").length).toBe(2)
        const buttons = wrapper.findAll("button")
        expectTranslatedWithStoreType(buttons.at(0), "back", "retour", "voltar", store)
        expectTranslatedWithStoreType(buttons.at(1), "next", "suivant", "próximo", store)
    })

    it(`next button can navigate to reviewInputs`, () => {
        const store = createSut()
        const wrapper = shallowMount(DataExploration, {store});
        expect(wrapper.findAll("button").length).toBe(2)
        expect(wrapper.find("survey-and-program-stub").exists()).toBe(false)
        const buttons = wrapper.findAll("button")
        buttons.at(1).trigger("click")
        expect(wrapper.find("survey-and-program-stub").exists()).toBe(true)
    })

    it(`back button can navigate to uploadInputs`, () => {
        const store = createSut()
        const wrapper = shallowMount(DataExploration, {
            store,
            data() {
                return {step: 2}
            }
        });
        expect(wrapper.findAll("button").length).toBe(2)
        expect(wrapper.find("baseline-stub").exists()).toBe(false)
        const buttons = wrapper.findAll("button")
        buttons.at(0).trigger("click")
        expect(wrapper.find("baseline-stub").exists()).toBe(true)
    })

});