import {shallowMount} from "@vue/test-utils";
import DataExploration from "../../../app/components/dataExploration/DataExploration.vue"
import Vuex from "vuex";
import {
    mockBaselineState, mockProgramResponse, mockShapeResponse,
    mockSurveyAndProgramState, mockSurveyResponse
} from "../../mocks";
import {getters} from "../../../app/store/surveyAndProgram/getters";
import {baselineGetters} from "../../../app/store/baseline/baseline";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {BaselineActions} from "../../../app/store/baseline/actions";
import {SurveyAndProgramActions} from "../../../app/store/surveyAndProgram/actions";
import {BaselineState} from "../../../app/store/baseline/baseline";
import {DataType, SurveyAndProgramState} from "../../../app/store/surveyAndProgram/surveyAndProgram";
import {initialDataExplorationState} from "../../../app/store/dataExploration/dataExploration";
import {initialDataExplorationStepperState, StepperState} from "../../../app/store/stepper/stepper";
import {mutations as stepperMutations} from "../../../app/store/stepper/mutations";
import {actions as stepperActions} from "../../../app/store/stepper/actions";

describe(`data exploration component`, () => {
    let actions: jest.Mocked<BaselineActions>;
    let mutations = {};

    let sapActions: jest.Mocked<SurveyAndProgramActions>;
    let sapMutations = {};

    const createStore = (baselineState?: Partial<BaselineState>,
                         surveyAndProgramState: Partial<SurveyAndProgramState> = {selectedDataType: DataType.Survey},
                         plottingMetadataMock = jest.fn(),
                         stepperState: Partial<StepperState> = {}) => {

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
            state: initialDataExplorationState(),
            modules: {
                baseline: {
                    namespaced: true,
                    state: mockBaselineState(baselineState),
                    actions: {...actions},
                    mutations: {...mutations},
                    getters: {...baselineGetters}
                },
                surveyAndProgram: {
                    namespaced: true,
                    state: mockSurveyAndProgramState(surveyAndProgramState),
                    mutations: {...sapMutations},
                    actions: {...sapActions},
                    getters: getters
                },
                metadata: {
                    namespaced: true,
                    actions: {
                        getPlottingMetadata: plottingMetadataMock
                    }
                },
                stepper: {
                    namespaced: true,
                    state: {...initialDataExplorationStepperState(), ...stepperState},
                    actions: stepperActions,
                    mutations: stepperMutations
                }
            }
        });

        registerTranslations(store);
        return store;
    };

    it(`renders components as expect`, () => {
        const store = createStore()
        const wrapper = shallowMount(DataExploration, {store});
        expect(wrapper.find("adr-integration-stub").exists()).toBe(true)
        expect(wrapper.find("upload-inputs-stub").exists()).toBe(true)
        expect(wrapper.findAll("stepper-navigation-stub").exists()).toBe(true)
    })

    it(`disables back navigation when on upload step`, () => {
        const store = createStore()
        const wrapper = shallowMount(DataExploration, {store});
        expect(wrapper.find("stepper-navigation-stub").props("backDisabled")).toBe(true)
    })

    it(`disables forward navigation when inputs are not valid`, () => {
        const store = createStore()
        const wrapper = shallowMount(DataExploration, {store});
        expect(wrapper.find("stepper-navigation-stub").props("nextDisabled")).toBe(true)
    })

    it(`enables forward navigation when inputs are valid`, () => {
        const store = createStore(
            {
                shape: mockShapeResponse(),
                validatedConsistent: true
            },
            {
                program: mockProgramResponse()
            })
        const wrapper = shallowMount(DataExploration, {store});
        expect(wrapper.find("stepper-navigation-stub").props("nextDisabled")).toBe(false)
    })

    it(`disables continue navigation when on review step`, () => {
        const store = createStore({shape: mockShapeResponse()}, {survey: mockSurveyResponse()},
            jest.fn(), {activeStep: 2});
        const wrapper = shallowMount(DataExploration, {store});

        expect(wrapper.find("stepper-navigation-stub").props("backDisabled")).toBe(false)
        expect(wrapper.find("stepper-navigation-stub").props("nextDisabled")).toBe(true)
    })

    it(`can navigate to reviewInputs`, () => {
        const store = createStore()
        const wrapper = shallowMount(DataExploration, {store});
        expect(wrapper.find("review-inputs-stub").exists()).toBe(false)
        const vm = wrapper.vm as any
        vm.next()
        expect(wrapper.find("review-inputs-stub").exists()).toBe(true)
    })

    it(`can navigate to uploadInputs`, () => {
        const store = createStore({}, {}, jest.fn(), {activeStep: 2});
        const wrapper = shallowMount(DataExploration, {store});

        expect(wrapper.find("upload-inputs-stub").exists()).toBe(false)
        const vm = wrapper.vm as any
        vm.back()
        expect(wrapper.find("upload-inputs-stub").exists()).toBe(true)
    });

    it("requests plotting metadata on mount", () => {
        const metadataMock = jest.fn();
        const store = createStore({}, {}, metadataMock)
        const wrapper = shallowMount(DataExploration, {store})
        expect(metadataMock.mock.calls.length).toBe(1);
    });

});
