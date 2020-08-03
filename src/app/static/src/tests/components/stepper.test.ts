import {createLocalVue, shallowMount, Wrapper, mount} from '@vue/test-utils';
import Vue from 'vue';
import Vuex, {Store} from 'vuex';
import {baselineGetters, BaselineState} from "../../app/store/baseline/baseline";
import {
    mockBaselineState,
    mockLoadState,
    mockMetadataState,
    mockModelOptionsState,
    mockModelRunState,
    mockPlottingMetadataResponse,
    mockPopulationResponse,
    mockShapeResponse, mockStepperState,
    mockSurveyAndProgramState, mockValidateBaselineResponse, mockVersionsState
} from "../mocks";
import {SurveyAndProgramState} from "../../app/store/surveyAndProgram/surveyAndProgram";
import {getters as surveyAndProgramGetters} from "../../app/store/surveyAndProgram/getters";
import {mutations} from '../../app/store/baseline/mutations';
import {mutations as surveyAndProgramMutations} from '../../app/store/surveyAndProgram/mutations';
import {mutations as modelRunMutations} from '../../app/store/modelRun/mutations';
import {mutations as stepperMutations} from '../../app/store/stepper/mutations';
import {mutations as loadMutations} from '../../app/store/load/mutations';
import {modelRunGetters, ModelRunState} from "../../app/store/modelRun/modelRun";
import Stepper from "../../app/components/Stepper.vue";
import Step from "../../app/components/Step.vue";
import LoadingSpinner from "../../app/components/LoadingSpinner.vue";
import {actions} from "../../app/store/stepper/actions";
import {getters} from "../../app/store/stepper/getters";
import {StepperState} from "../../app/store/stepper/stepper";
import {actions as rootActions} from "../../app/store/root/actions"
import {mutations as rootMutations} from "../../app/store/root/mutations"
import {metadataGetters, MetadataState} from "../../app/store/metadata/metadata";
import {ModelStatusResponse} from "../../app/generated";
import {modelOptionsGetters} from "../../app/store/modelOptions/modelOptions";
import {LoadingState, LoadState} from "../../app/store/load/load";
import registerTranslations from "../../app/store/translations/registerTranslations";
import {VersionsState} from "../../app/store/versions/versions";

const localVue = createLocalVue();

declare var currentUser: string; // set in jest config, or on the index page when run for real

describe("Stepper component", () => {
    const createSut = (baselineState?: Partial<BaselineState>,
                       surveyAndProgramState?: Partial<SurveyAndProgramState>,
                       metadataState?: Partial<MetadataState>,
                       modelRunState?: Partial<ModelRunState>,
                       stepperState?: Partial<StepperState>,
                       loadState?: Partial<LoadState>,
                       versionsState?: Partial<VersionsState>,
                       mockRouterPush = jest.fn()) => {

        const store =  new Vuex.Store({
            actions: rootActions,
            mutations: rootMutations,
            modules: {
                baseline: {
                    namespaced: true,
                    state: mockBaselineState(baselineState),
                    getters: baselineGetters,
                    mutations
                },
                surveyAndProgram: {
                    namespaced: true,
                    state: mockSurveyAndProgramState(surveyAndProgramState),
                    getters: surveyAndProgramGetters,
                    mutations: surveyAndProgramMutations
                },
                modelRun: {
                    namespaced: true,
                    state: mockModelRunState(modelRunState),
                    mutations: modelRunMutations,
                    getters: modelRunGetters
                },
                modelOptions: {
                    namespaced: true,
                    state: mockModelOptionsState(),
                    getters: modelOptionsGetters
                },
                stepper: {
                    namespaced: true,
                    state: mockStepperState(stepperState),
                    mutations: stepperMutations,
                    actions: actions,
                    getters
                },
                metadata: {
                    namespaced: true,
                    state: mockMetadataState(metadataState),
                    getters: metadataGetters
                },
                load: {
                    namespaced: true,
                    state: mockLoadState(loadState),
                    mutations: loadMutations
                },
                versions: {
                    namespaced: true,
                    state: mockVersionsState(versionsState)
                }
            }
        });
        registerTranslations(store);

        const mocks = {
            $router: {
                push: mockRouterPush
            }
        };

        return shallowMount(Stepper, {store, localVue, mocks});
    };

    const completedBaselineState = {
        country: "testCountry",
        iso3: "TTT",
        shape: mockShapeResponse(),
        population: mockPopulationResponse(),
        ready: true,
        validatedConsistent: true
    };

    afterEach(() => {
        localStorage.clear();
    });

    it("renders loading spinner while states are not ready", () => {

        const wrapper = createSut();
        expect(wrapper.findAll(LoadingSpinner).length).toBe(1);
        expect(wrapper.findAll(".content").length).toBe(0);
        expect(wrapper.find("#loading-message").text()).toBe("Loading your data");
    });

    it("renders loading spinner while ready but loadingFromFile", () => {

        const wrapper = createSut(
            {ready: true},
            {ready: true},
            {},
            {ready: true},
            {},
            {loadingState: LoadingState.SettingFiles});

        expect(wrapper.findAll(LoadingSpinner).length).toBe(1);
        expect(wrapper.findAll(".content").length).toBe(0);
        expect(wrapper.find("#loading-message").text()).toBe("Loading your data");
    });

    it("does not render loading spinner once states are ready", () => {
        const wrapper = createSut({ready: true}, {ready: true}, {}, {ready: true});
        expect(wrapper.findAll(LoadingSpinner).length).toBe(0);
        expect(wrapper.findAll(".content").length).toBe(1);
        expect(wrapper.findAll("#loading-message").length).toBe(0);
    });

    it("renders steps", () => {
        const wrapper = createSut({ready: true}, {ready: true}, {}, {ready: true});
        const steps = wrapper.findAll(Step);

        expect(wrapper.findAll(Step).length).toBe(6);
        console.log("HERE IT IS");
        console.log(wrapper.html());
        expect(steps.at(0).props().textKey).toBe("uploadBaseline");
        expect(steps.at(0).props().active).toBe(true);
        expect(steps.at(0).props().number).toBe(1);
        expect(steps.at(0).props().complete).toBe(false);
        expect(steps.at(0).props().enabled).toBe(true);

        expect(steps.at(1).props().textKey).toBe("uploadSurvey");
        expect(steps.at(1).props().active).toBe(false);
        expect(steps.at(1).props().number).toBe(2);
        expect(steps.at(1).props().complete).toBe(false);
        expect(steps.at(1).props().enabled).toBe(false);

        expect(steps.at(2).props().textKey).toBe("modelOptions");
        expect(steps.at(2).props().active).toBe(false);
        expect(steps.at(2).props().number).toBe(3);
        expect(steps.at(2).props().complete).toBe(false);
        expect(steps.at(2).props().enabled).toBe(false);

        expect(steps.at(3).props().textKey).toBe("runModel");
        expect(steps.at(3).props().active).toBe(false);
        expect(steps.at(3).props().number).toBe(4);
        expect(steps.at(3).props().complete).toBe(false);
        expect(steps.at(3).props().enabled).toBe(false);

        expect(steps.at(4).props().textKey).toBe("reviewOutput");
        expect(steps.at(4).props().active).toBe(false);
        expect(steps.at(4).props().number).toBe(5);
        expect(steps.at(4).props().complete).toBe(false);
        expect(steps.at(4).props().enabled).toBe(false);

        expect(steps.at(5).props().textKey).toBe("downloadResults");
        expect(steps.at(5).props().active).toBe(false);
        expect(steps.at(5).props().number).toBe(6);
        expect(steps.at(5).props().complete).toBe(false);
        expect(steps.at(5).props().enabled).toBe(false);
    });

    it("renders step connectors", () => {
        const wrapper = createSut({ready: true}, {ready: true}, {}, {ready: true});
        const connectors = wrapper.findAll(".step-connector");

        expect(connectors.length).toBe(5);
        // all should not be enabled at first
        expect(connectors.filter(c => c.classes().indexOf("enabled") > -1).length).toBe(0);
    });

    it("step connector is enabled if next step is", () => {
        const wrapper = createSut({ready: true},
            {ready: true, survey: true, program: true, shape: true} as any,
            {},
            {ready: true});
        const connectors = wrapper.findAll(".step-connector");

        expect(connectors.at(0).classes()).toContain("enabled");
        expect(connectors.filter(c => c.classes().indexOf("enabled") > -1).length).toBe(1);
    });

    it("all steps except baseline are disabled initially", () => {
        const wrapper = createSut({ready: true}, {ready: true}, {}, {ready: true});
        const steps = wrapper.findAll(Step);
        expect(steps.at(0).props().enabled).toBe(true);
        expect([1, 2, 3, 4, 5].filter(i => steps.at(i).props().enabled).length).toBe(0);
    });

    it("upload surveys step is enabled when baseline step is complete", () => {
        const wrapper = createSut(completedBaselineState,
            {ready: true},
            {plottingMetadata: "TEST DATA" as any},
            {ready: true});
        const steps = wrapper.findAll(Step);
        expect(steps.at(0).props().enabled).toBe(true);
        expect(steps.at(1).props().enabled).toBe(true);
        expect(steps.at(0).props().complete).toBe(true);
        expect([2, 3, 4, 5].filter(i => steps.at(i).props().enabled).length).toBe(0);
    });

    it("upload surveys step is not enabled if metadata state is not complete", () => {
        const wrapper = createSut(completedBaselineState,
            {ready: true},
            {plottingMetadata: null},
            {ready: true});
        const steps = wrapper.findAll(Step);
        expect(steps.at(0).props().enabled).toBe(true);
        expect(steps.at(1).props().enabled).toBe(false);
        expect(steps.at(0).props().complete).toBe(false);
        expect([1, 2, 3, 4, 5].filter(i => steps.at(i).props().enabled).length).toBe(0);
    });

    it("updates active step when jump event is emitted", () => {
        const wrapper = createSut(completedBaselineState,
            {ready: true},
            {plottingMetadata: "TEST DATA" as any},
            {ready: true});
        const steps = wrapper.findAll(Step);
        steps.at(1).vm.$emit("jump", 2);
        expect(steps.at(0).props().complete).toBe(true);
        expect(steps.at(1).props().active).toBe(true);
    });

    it("cannot continue when the active step is not complete", () => {
        const wrapper = createSut({country: "", ready: true}, {ready: true}, {}, {ready: true});
        const continueLink = wrapper.find("#continue");
        expect(continueLink.classes()).toContain("disabled");

        continueLink.trigger("click");
        const steps = wrapper.findAll(Step);
        expect(steps.at(0).props().active).toBe(true);
    });


    it("can continue when the active step is complete", () => {
        const wrapper = createSut(completedBaselineState,
            {ready: true},
            {plottingMetadata: "TEST DATA" as any},
            {ready: true});
        const continueLink = wrapper.find("#continue");
        expect(continueLink.classes()).not.toContain("disabled");

        continueLink.trigger("click");
        const steps = wrapper.findAll(Step);
        expect(steps.at(1).props().active).toBe(true);
    });


    it("cannot go back from the first step", () => {
        const wrapper = createSut({country: "", ready: true}, {ready: true}, {}, {ready: true});
        const backLink = wrapper.find("#back");
        expect(backLink.classes()).toContain("disabled");
    });

    it("can go back from later steps", () => {
        const wrapper = createSut({
                country: "testCountry",
                iso3: "TTT",
                shape: mockShapeResponse(),
                population: mockPopulationResponse(),
                ready: true
            },
            {ready: true},
            {plottingMetadata: "TEST DATA" as any},
            {ready: true},
            {activeStep: 2});

        const backLink = wrapper.find("#back");
        expect(backLink.classes()).not.toContain("disabled");

        backLink.trigger("click");
        const steps = wrapper.findAll(Step);
        expect(steps.at(0).props().active).toBe(true);
    });

    it("updates from completed state when active step data is populated", (done) => {
        const baselineState = {
            country: "Malawi",
            iso3: "MWI",
            population: mockPopulationResponse(),
            shape: mockShapeResponse(),
            ready: true
        };
        const wrapper = createSut(baselineState,
            {ready: true},
            {plottingMetadata: "TEST DATA" as any},
            {ready: true});
        const continueLink = wrapper.find("#continue");
        expect(continueLink.classes()).toContain("disabled");

        //invoke the mutation
        wrapper.vm.$store.commit("baseline/Validated", {
            "type": "Validated",
            "payload": mockValidateBaselineResponse()
        });

        Vue.nextTick().then(() => {
            expect(wrapper.find("#continue").classes()).not.toContain("disabled");
            done();
        });
    });

    it("active step only becomes active once state becomes ready", async () => {

        const wrapper = createSut(completedBaselineState,
            {},
            {plottingMetadata: mockPlottingMetadataResponse()},
            {ready: true},
            {activeStep: 2});

        let steps = wrapper.findAll(Step);
        expect(steps.filter(s => s.props().active).length).toBe(0);

        await makeReady(wrapper);
        steps = wrapper.findAll(Step);
        expect(steps.at(1).props().active).toBe(true);
    });

    it("complete steps only shown as complete once state becomes ready", async () => {

        const wrapper = createSut(
            completedBaselineState,
            {},
            {
                plottingMetadata: "TEST DATA" as any
            },
            {ready: true});

        let steps = wrapper.findAll(Step);
        expect(steps.filter(s => s.props().complete).length).toBe(0);

        await makeReady(wrapper);
        steps = wrapper.findAll(Step);
        expect(steps.at(0).props().complete).toBe(true);
    });

    it("steps only shown as enabled once state becomes ready, and not loading", async () => {

        const wrapper = createSut(completedBaselineState,
            {},
            {plottingMetadata: "TEST DATA" as any},
            {ready: true});
        let steps = wrapper.findAll(Step);
        expect(steps.filter(s => s.props().enabled).length).toBe(0);

        await makeReady(wrapper);
        steps = wrapper.findAll(Step);
        expect(steps.at(1).props().enabled).toBe(true);
    });

    it("steps not shown as enabled if state becomes ready, but is also loading", async () => {

        const wrapper = createSut(completedBaselineState,
            {},
            {plottingMetadata: "TEST DATA" as any},
            {ready: true});

        let steps = wrapper.findAll(Step);
        expect(steps.filter(s => s.props().enabled).length).toBe(0);

        await makeReady(wrapper);
        await makeLoading(wrapper);
        steps = wrapper.findAll(Step);
        expect(steps.at(1).props().enabled).toBe(false);
    });

    async function makeReady(wrapper: Wrapper<any>) {

        wrapper.vm.$store.commit("surveyAndProgram/Ready", {
            "type": "Ready",
            "payload": true
        });

        await Vue.nextTick();
        expect(wrapper.findAll(LoadingSpinner).length).toBe(0);
    }

    async function makeLoading(wrapper: Wrapper<any>) {

        wrapper.vm.$store.commit("load/SettingFiles", {
            "type": "SettingFiles",
            "payload": null
        });

        await Vue.nextTick();
        expect(wrapper.findAll(LoadingSpinner).length).toBe(1);
    }

    it("model run step is not complete without success", () => {
        const wrapper = createSut({ready: true}, {ready: true}, {}, {ready: true, result: "TEST" as any});
        const steps = wrapper.findAll(Step);
        expect(steps.at(3).props().complete).toBe(false);
    });

    it("model run step is not complete without result", () => {
        const wrapper = createSut({ready: true}, {ready: true}, {}, {ready: true, status: {success: true} as any});
        const steps = wrapper.findAll(Step);
        expect(steps.at(3).props().complete).toBe(false);
    });

    it("model run step is not complete with errors", () => {
        const modelRunState = {
            ready: true, status: {success: true} as ModelStatusResponse,
            result: "TEST" as any,
            errors: ["TEST" as any]
        };
        const wrapper = createSut({ready: true}, {ready: true}, {}, modelRunState);
        const steps = wrapper.findAll(Step);
        expect(steps.at(3).props().complete).toBe(false);
    });

    it("model run step is complete on success and result", () => {
        const modelRunState = {
            ready: true,
            result: "TEST" as any,
            status: {success: true} as ModelStatusResponse
        };
        const wrapper = createSut({ready: true}, {ready: true}, {}, modelRunState);
        const steps = wrapper.findAll(Step);
        expect(steps.at(3).props().complete).toBe(true);
    });

    it("model run step becomes complete on success and result fetched", async () => {
        const wrapper = createSut({ready: true}, {ready: true}, {}, {ready: true});

        wrapper.vm.$store.commit("modelRun/RunStatusUpdated", {
            "type": "RunStatusUpdated",
            "payload": {
                id: "1234",
                success: true,
                done: true,
                queue: 1,
                progress: "",
                timeRemaining: "",
                status: "running"
            }
        });

        wrapper.vm.$store.commit("modelRun/RunResultFetched", {
            "type": "RunResultFetched",
            "payload": "TEST"
        });

        await Vue.nextTick();

        const steps = wrapper.findAll(Step);
        expect(steps.at(3).props().complete).toBe(true);
    });

    it("validates state once ready", async () => {
        const spy = jest.spyOn(rootActions as any, "validate");
        const wrapper = createSut({ready: true}, {}, {}, {ready: true});
        expect(spy).not.toHaveBeenCalled();

        await makeReady(wrapper);
        expect(spy).toHaveBeenCalled();
    });

    it("pushes router to versions if logged in user and currentVersion not set", () => {
        const mockRouterPush = jest.fn();
        //current user is set in jest.config and currentVersion is not set be default in the wrapper
        const wrapper = createSut({}, {}, {}, {}, {}, {}, {},  mockRouterPush);

        expect(mockRouterPush.mock.calls.length).toBe(1);
        expect(mockRouterPush.mock.calls[0][0]).toBe("/versions");
    });

    it("does not push router to versions if guest user", () => {
        currentUser = "guest";
        const mockRouterPush = jest.fn();
        const wrapper = createSut({}, {}, {}, {}, {}, {}, {}, mockRouterPush);

        expect(mockRouterPush.mock.calls.length).toBe(0);
    });

    it("does not push router to logged in user and currentVersion set", () => {
        const mockRouterPush = jest.fn();
        const versionsState = {currentVersion: {id: 1, name: "testVersion", snapshots: []}};
        const wrapper =  createSut({}, {}, {}, {}, {}, {}, versionsState, mockRouterPush);

        expect(mockRouterPush.mock.calls.length).toBe(0);
    });
});
