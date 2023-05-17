import {shallowMount, VueWrapper} from "@vue/test-utils";
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
import {DataExplorationState, initialDataExplorationState} from "../../../app/store/dataExploration/dataExploration";
import {initialDataExplorationStepperState, StepperState} from "../../../app/store/stepper/stepper";
import {mutations as stepperMutations} from "../../../app/store/stepper/mutations";
import {actions as stepperActions} from "../../../app/store/stepper/actions";
import LoadingSpinner from "../../../app/components/LoadingSpinner.vue";
import {expectTranslated} from "../../testHelpers";
import StepperNavigation from "../../../app/components/StepperNavigation.vue";

describe(`data exploration component`, () => {
    let actions: jest.Mocked<BaselineActions>;
    let mutations = {};

    let sapActions: jest.Mocked<SurveyAndProgramActions>;
    let sapMutations = {};

    const defaultBaselineState = {ready: true};
    const defaultSAPState = {ready: true, selectedDataType: DataType.Survey};

    const createStore = (baselineState: Partial<BaselineState> = defaultBaselineState,
                         surveyAndProgramState: Partial<SurveyAndProgramState> = defaultSAPState,
                         plottingMetadataMock = jest.fn(),
                         stepperState: Partial<StepperState> = {},
                         dataExplorationState: Partial<DataExplorationState> = {}) => {

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
            state: {...initialDataExplorationState(), ...dataExplorationState},
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
        expect(wrapper.findComponent("adr-integration-stub").exists()).toBe(true)
        expect(wrapper.findComponent("upload-inputs-stub").exists()).toBe(true)
        expect(wrapper.findAllComponents("stepper-navigation-stub").exists()).toBe(true)
    })

    it(`disables back navigation when on upload step`, () => {
        const store = createStore()
        const wrapper = shallowMount(DataExploration, {store});
        expect((wrapper.findComponent("stepper-navigation-stub") as VueWrapper).props("backDisabled")).toBe(true)
    })

    it(`disables forward navigation when inputs are not valid`, () => {
        const store = createStore()
        const wrapper = shallowMount(DataExploration, {store});
        expect((wrapper.findComponent("stepper-navigation-stub") as VueWrapper).props("nextDisabled")).toBe(true)
    })

    it(`enables forward navigation when inputs are valid`, () => {
        const store = createStore(
            {
                ...defaultBaselineState,
                shape: mockShapeResponse(),
                validatedConsistent: true
            },
            {
                ...defaultSAPState,
                program: mockProgramResponse()
            })
        const wrapper = shallowMount(DataExploration, {store});
        expect((wrapper.findComponent("stepper-navigation-stub") as VueWrapper).props("nextDisabled")).toBe(false)
    })

    it(`disables continue navigation when on review step`, () => {
        const store = createStore(
            {...defaultBaselineState, shape: mockShapeResponse()},
            {...defaultBaselineState, survey: mockSurveyResponse()},
            jest.fn(),
            {activeStep: 2}
        );
        const wrapper = shallowMount(DataExploration, {store});

        expect((wrapper.findComponent("stepper-navigation-stub") as VueWrapper).props("backDisabled")).toBe(false)
        expect((wrapper.findComponent("stepper-navigation-stub") as VueWrapper).props("nextDisabled")).toBe(true)
    })

    it(`can navigate to reviewInputs`, () => {
        const store = createStore()
        const wrapper = shallowMount(DataExploration, {store});
        expect(wrapper.findComponent("review-inputs-stub").exists()).toBe(false)
        const vm = wrapper.vm as any
        vm.next()
        expect(wrapper.findComponent("review-inputs-stub").exists()).toBe(true)
    })

    it(`can navigate to uploadInputs`, () => {
        const store = createStore(defaultBaselineState, defaultSAPState, jest.fn(), {activeStep: 2});
        const wrapper = shallowMount(DataExploration, {store});

        expect(wrapper.findComponent("upload-inputs-stub").exists()).toBe(false)
        const vm = wrapper.vm as any
        vm.back()
        expect(wrapper.findComponent("upload-inputs-stub").exists()).toBe(true)
    });

    it("requests plotting metadata on mount", () => {
        const metadataMock = jest.fn();
        const store = createStore({}, {}, metadataMock)
        const wrapper = shallowMount(DataExploration, {store})
        expect(metadataMock.mock.calls.length).toBe(1);
    });

    const expectLoadingView = (wrapper: Wrapper<any>) => {
        expect(wrapper.findComponent("adr-integration-stub").exists()).toBe(false);
        expect(wrapper.findComponent("upload-inputs-stub").exists()).toBe(false);
        expect(wrapper.findComponent("review-inputs-stub").exists()).toBe(false);
        expect(wrapper.findComponent(LoadingSpinner).props("size")).toBe("lg");
        expectTranslated(wrapper.findComponent("#loading-message"),
            "Loading your data", "Chargement de vos données",
            "A carregar os seus dados", wrapper.vm.$store);
        expect(wrapper.findComponent(StepperNavigation).props("backDisabled")).toBe(true);
        expect(wrapper.findComponent(StepperNavigation).props("nextDisabled")).toBe(true);
    };

    it("shows loading spinner and disabled navigation when baseline not ready", () => {
        const store = createStore({ready: false});
        const wrapper = shallowMount(DataExploration, {store});
        expectLoadingView(wrapper);
    });

    it("shows loading spinner and disabled navigation when surveyAndProgram not ready", () => {
        const store = createStore(defaultBaselineState, {ready: false});
        const wrapper = shallowMount(DataExploration, {store});
        expectLoadingView(wrapper);
    });

    it("shows loading spinner and disabled navigation when updating language", () => {
        const dataExplorationState = {updatingLanguage: true};
        const store = createStore(defaultBaselineState, defaultSAPState, jest.fn(), {},
            dataExplorationState);
        const wrapper = shallowMount(DataExploration, {store});
        expectLoadingView(wrapper);
    });
});
