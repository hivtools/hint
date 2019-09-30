import {createLocalVue, shallowMount, Wrapper} from '@vue/test-utils';
import Vue from 'vue';
import Vuex, {Store} from 'vuex';
import {baselineGetters, BaselineState} from "../../app/store/baseline/baseline";
import {
    mockBaselineState,
    mockModelRunState,
    mockPopulationResponse,
    mockShapeResponse, mockStepperState,
    mockSurveyAndProgramState
} from "../mocks";
import {SurveyAndProgramDataState, surveyAndProgramGetters} from "../../app/store/surveyAndProgram/surveyAndProgram";
import {mutations} from '../../app/store/baseline/mutations';
import {mutations as surveyAndProgramMutations} from '../../app/store/surveyAndProgram/mutations';
import {mutations as modelRunMutations} from '../../app/store/modelRun/mutations';
import {mutations as stepperMutations} from '../../app/store/stepper/mutations';

import {ModelRunState} from "../../app/store/modelRun/modelRun";

import Stepper from "../../app/components/Stepper.vue";
import Step from "../../app/components/Step.vue";
import LoadingSpinner from "../../app/components/LoadingSpinner.vue";
import {actions} from "../../app/store/stepper/actions";
import {getters} from "../../app/store/stepper/getters";
import {StepperState} from "../../app/store/stepper/stepper";
import {actions as rootActions} from "../../app/store/root/actions"

const localVue = createLocalVue();
Vue.use(Vuex);

describe("Stepper component", () => {
    const createSut = (baselineState?: Partial<BaselineState>,
                       surveyAndProgramState?: Partial<SurveyAndProgramDataState>,
                       modelRunState?: Partial<ModelRunState>,
                       stepperState?: Partial<StepperState>) => {

        return new Vuex.Store({
            actions: rootActions,
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
                    mutations: modelRunMutations
                },
                stepper: {
                    namespaced: true,
                    state: mockStepperState(stepperState),
                    mutations: stepperMutations,
                    actions: actions,
                    getters
                }
            }
        })
    };

    afterEach(() => {
        localStorage.clear();
    });

    it("renders loading spinner while states are not ready", () => {

        const store = createSut();
        const wrapper = shallowMount(Stepper, {store, localVue});
        expect(wrapper.findAll(LoadingSpinner).length).toBe(1);
        expect(wrapper.findAll(".content").length).toBe(0);
        expect(wrapper.find("#loading-message").text()).toBe("Loading your data");
    });

    it("does not render loading spinner once states are ready", () => {
        const store = createSut({ready: true}, {ready: true});
        const wrapper = shallowMount(Stepper, {store, localVue});
        expect(wrapper.findAll(LoadingSpinner).length).toBe(0);
        expect(wrapper.findAll(".content").length).toBe(1);
        expect(wrapper.findAll("#loading-message").length).toBe(0);
    });

    it("renders steps", () => {
        const store = createSut({ready: true}, {ready: true});
        const wrapper = shallowMount(Stepper, {store, localVue});
        const steps = wrapper.findAll(Step);

        expect(wrapper.findAll(Step).length).toBe(5);
        expect(steps.at(0).props().text).toBe("Upload baseline data");
        expect(steps.at(0).props().active).toBe(true);
        expect(steps.at(0).props().number).toBe(1);
        expect(steps.at(0).props().complete).toBe(false);

        expect(steps.at(1).props().text).toBe("Upload survey and programme data");
        expect(steps.at(1).props().active).toBe(false);
        expect(steps.at(1).props().number).toBe(2);
        expect(steps.at(1).props().complete).toBe(false);

        expect(steps.at(2).props().text).toBe("Review uploads");
        expect(steps.at(2).props().active).toBe(false);
        expect(steps.at(2).props().number).toBe(3);
        expect(steps.at(2).props().complete).toBe(false);

        expect(steps.at(3).props().text).toBe("Run model");
        expect(steps.at(3).props().active).toBe(false);
        expect(steps.at(3).props().number).toBe(4);
        expect(steps.at(3).props().complete).toBe(false);

        expect(steps.at(4).props().text).toBe("Review output");
        expect(steps.at(4).props().active).toBe(false);
        expect(steps.at(4).props().number).toBe(5);
        expect(steps.at(4).props().complete).toBe(false);
    });

    it("all steps except baseline are disabled initially", () => {
        const store = createSut({ready: true}, {ready: true});
        const wrapper = shallowMount(Stepper, {store, localVue});
        const steps = wrapper.findAll(Step);
        expect(steps.at(0).props().enabled).toBe(true);
        expect([1, 2, 3, 4].filter(i => steps.at(i).props().enabled).length).toBe(0);
    });

    it("upload surveys step is enabled when baseline step is complete", () => {
        const store = createSut({
            country: "testCountry",
            shape: mockShapeResponse(),
            population: mockPopulationResponse(),
            ready: true
        }, {ready: true});
        const wrapper = shallowMount(Stepper, {store, localVue});
        const steps = wrapper.findAll(Step);
        expect(steps.at(0).props().enabled).toBe(true);
        expect(steps.at(1).props().enabled).toBe(true);
        expect(steps.at(0).props().complete).toBe(true);
        expect([2, 3, 4].filter(i => steps.at(i).props().enabled).length).toBe(0);
    });

    it("updates active step when jump event is emitted", () => {
        const store = createSut({
            country: "testCountry",
            shape: mockShapeResponse(),
            population: mockPopulationResponse(),
            ready: true
        }, {ready: true});
        const wrapper = shallowMount(Stepper, {store, localVue});
        const steps = wrapper.findAll(Step);
        steps.at(1).vm.$emit("jump", 2);
        expect(steps.at(0).props().complete).toBe(true);
        expect(steps.at(1).props().active).toBe(true);
    });

    it("cannot continue when the active step is not complete", () => {
        const store = createSut({country: "", ready: true}, {ready: true});
        const wrapper = shallowMount(Stepper, {store, localVue});
        const continueLink = wrapper.find("#continue");
        expect(continueLink.classes()).toContain("disabled");

        continueLink.trigger("click");
        const steps = wrapper.findAll(Step);
        expect(steps.at(0).props().active).toBe(true);
    });


    it("can continue when the active step is complete", () => {
        const store = createSut({
            country: "testCountry",
            shape: mockShapeResponse(),
            population: mockPopulationResponse(),
            ready: true
        }, {ready: true});
        const wrapper = shallowMount(Stepper, {store, localVue});
        const continueLink = wrapper.find("#continue");
        expect(continueLink.classes()).not.toContain("disabled");

        continueLink.trigger("click");
        const steps = wrapper.findAll(Step);
        expect(steps.at(1).props().active).toBe(true);
    });

    it("updates from completed state when active step data is populated", (done) => {
        const baselineState = {country: "Malawi", population: mockPopulationResponse(), ready: true};
        const store = createSut(baselineState, {ready: true});
        const wrapper = shallowMount(Stepper, {store, localVue});
        const continueLink = wrapper.find("#continue");
        expect(continueLink.classes()).toContain("disabled");

        //invoke the mutation
        store.commit("baseline/ShapeUpdated", {
            "type": "ShapeUpdated",
            "payload": mockShapeResponse()
        });

        Vue.nextTick().then(() => {
            expect(wrapper.find("#continue").classes()).not.toContain("disabled");
            done();
        });
    });

    it("active step only becomes active once state becomes ready", async () => {

        const store = createSut({
            ready: true,
            country: "Malawi",
            shape: mockShapeResponse(),
            population: mockPopulationResponse()
        }, {}, {}, {activeStep: 2});

        const wrapper = shallowMount(Stepper, {store, localVue});
        let steps = wrapper.findAll(Step);
        expect(steps.filter(s => s.props().active).length).toBe(0);

        await makeReady(store, wrapper);
        steps = wrapper.findAll(Step);
        expect(steps.at(1).props().active).toBe(true);
    });

    it("complete steps only shown as complete once state becomes ready", async () => {

        const store = createSut({
            ready: true,
            country: "Malawi",
            shape: mockShapeResponse(),
            population: mockPopulationResponse()
        });
        const wrapper = shallowMount(Stepper, {store, localVue});
        let steps = wrapper.findAll(Step);
        expect(steps.filter(s => s.props().complete).length).toBe(0);

        await makeReady(store, wrapper);
        steps = wrapper.findAll(Step);
        expect(steps.at(0).props().complete).toBe(true);
    });

    it("steps only shown as enabled once state becomes ready", async () => {

        const store = createSut({
            ready: true,
            country: "Malawi",
            shape: mockShapeResponse(),
            population: mockPopulationResponse()
        });
        const wrapper = shallowMount(Stepper, {store, localVue});
        let steps = wrapper.findAll(Step);
        expect(steps.filter(s => s.props().enabled).length).toBe(0);

        await makeReady(store, wrapper);
        steps = wrapper.findAll(Step);
        expect(steps.at(1).props().enabled).toBe(true);
    });

    async function makeReady(store: Store<any>, wrapper: Wrapper<any>) {

        store.commit("surveyAndProgram/Ready", {
            "type": "Ready",
            "payload": true
        });

        await Vue.nextTick();
        expect(wrapper.findAll(LoadingSpinner).length).toBe(0);
    }

    it("model run step is not complete without success", () => {
        const store = createSut({ready: true}, {ready: true}, {success: false});
        const wrapper = shallowMount(Stepper, {store, localVue});
        const steps = wrapper.findAll(Step);
        expect(steps.at(3).props().complete).toBe(false);
    });

    it("model run step is complete on success", () => {
        const store = createSut({ready: true}, {ready: true}, {success: true});
        const wrapper = shallowMount(Stepper, {store, localVue});
        const steps = wrapper.findAll(Step);
        expect(steps.at(3).props().complete).toBe(true);
    });

    it("model run step becomes complete on success", async () => {
        const store = createSut({ready: true}, {ready: true});
        const wrapper = shallowMount(Stepper, {store, localVue});

        store.commit("modelRun/RunStatusUpdated", {
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

        await Vue.nextTick();

        const steps = wrapper.findAll(Step);
        expect(steps.at(3).props().complete).toBe(true);
    });

    it("validates state once ready", async () => {
        const spy = jest.spyOn(rootActions as any, "validate");
        const store = createSut({ready: true});
        const wrapper = shallowMount(Stepper, {store, localVue});
        expect(spy).not.toHaveBeenCalled();

        await makeReady(store, wrapper);
        expect(spy).toHaveBeenCalled();
    });

});