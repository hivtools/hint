import {createLocalVue, shallowMount} from '@vue/test-utils';
import Vue from 'vue';
import Vuex, {Store} from 'vuex';
import {
    mockAxios,
    mockModelOptionsState,
    mockModelResultResponse,
    mockModelRunState,
    mockModelStatusResponse,
    mockSuccess
} from "../../mocks";
import {actions} from "../../../app/store/modelRun/actions";
import {mutations} from "../../../app/store/modelRun/mutations";
import {modelRunGetters, ModelRunState} from "../../../app/store/modelRun/modelRun";
import {RootState} from "../../../app/root";
import ModelRun from "../../../app/components/modelRun/ModelRun.vue";
import Modal from "../../../app/components/Modal.vue";
import Tick from "../../../app/components/Tick.vue";
import {ModelStatusResponse} from "../../../app/generated";
const localVue = createLocalVue();
Vue.use(Vuex);

describe("Model run component", () => {

    const createStore = (state: Partial<ModelRunState> = {}, testActions: any = actions): Store<RootState> => {
        return new Vuex.Store({
            modules: {
                modelRun: {
                    namespaced: true,
                    state: mockModelRunState(state),
                    actions: testActions,
                    mutations,
                    getters: modelRunGetters
                },
                modelOptions: {
                    state: mockModelOptionsState()
                }
            }
        });
    };

    const mockStatus = mockModelStatusResponse();

    beforeEach(() => {
        mockAxios.onPost(`/model/run/`)
            .reply(200, mockSuccess({id: "1234"}));

        mockAxios.onGet(`/model/status/1234`)
            .reply(200, mockSuccess(mockStatus));

        mockAxios.onGet(`/model/result/1234`)
            .reply(200, mockSuccess(mockModelResultResponse()));
    });

    afterEach(() => {
       mockAxios.reset();
    });

    it("run models and polls for status", (done) => {

        const store = createStore();
        const wrapper = shallowMount(ModelRun, {store, localVue});
        wrapper.find("button").trigger("click");

        setTimeout(() => {
            expect(wrapper.find("button").attributes().disabled).toBe("disabled");
            expect(store.state.modelRun.status).toStrictEqual({id: "1234"});
            expect(store.state.modelRun.modelRunId).toBe("1234");
            expect(store.state.modelRun.statusPollId).not.toBe(-1);
            expect(wrapper.find(Modal).props().open).toBe(true);

            setTimeout(() => {
                expect(wrapper.find("button").attributes().disabled).toBeUndefined();
                expect(store.state.modelRun.status).toStrictEqual(mockStatus);
                expect(store.state.modelRun.modelRunId).toBe("1234");
                expect(store.state.modelRun.statusPollId).toBe(-1);
                expect(wrapper.find(Modal).props().open).toBe(false);
                done();
            }, 2500);
        });
    });

    it("polls for status if runId already exists, pollId does not, and run not complete", (done) => {
        const store = createStore({modelRunId: "1234"});
        const wrapper = shallowMount(ModelRun, {store, localVue});
        expect(store.state.modelRun.status).toStrictEqual({});

        setTimeout(() => {
            expect(wrapper.find("button").attributes().disabled).toBeUndefined();
            expect(store.state.modelRun.status).toStrictEqual(mockStatus);
            expect(store.state.modelRun.modelRunId).toBe("1234");
            expect(store.state.modelRun.statusPollId).toBe(-1);
            expect(wrapper.find(Modal).props().open).toBe(false);
            done();
        }, 2500);
    });

    it("modal does not close until run result fetched", (done) => {
        const getResultMock = jest.fn();
        const store = createStore({}, {...actions, getResult: getResultMock});
        const wrapper = shallowMount(ModelRun, {store, localVue});
        wrapper.find("button").trigger("click");

        setTimeout(() => {
            expect(wrapper.find("button").attributes().disabled).toBe("disabled");
            expect(store.state.modelRun.status).toStrictEqual({id: "1234"});
            expect(store.state.modelRun.modelRunId).toBe("1234");
            expect(store.state.modelRun.statusPollId).not.toBe(-1);
            expect(wrapper.find(Modal).props().open).toBe(true);

            setTimeout(() => {
                // it should still be open because the result is missing
                expect(wrapper.find("button").attributes().disabled).toBe("disabled");
                expect(store.state.modelRun.result).toBe(null);
                expect(store.state.modelRun.status.success).toBe(true);
                expect(wrapper.find(Modal).props().open).toBe(true);
                clearInterval(store.state.modelRun.statusPollId);
                done();
            }, 2500);
        });
    });

    it("does not start polling on created if pollId already exists", (done) => {
        const store = createStore({modelRunId: "1234", statusPollId: 1});
        shallowMount(ModelRun, {store, localVue});

        setTimeout(() => {
            expect(mockAxios.history.get.length).toBe(0);
            done();
        }, 2500);
    });

    it("button is disabled and modal shown if status is started", () => {

        const store = createStore({
            status: {id: "1234", done: false} as ModelStatusResponse
        });

        const wrapper = shallowMount(ModelRun, {store, localVue});
        expect(wrapper.find("button").attributes().disabled).toBe("disabled");
        expect(wrapper.find(Modal).props().open).toBe(true);
        expect(wrapper.find(Modal).find("h4").text()).toBe("Running model");
    });

    it("on success button is not enabled until result exists", () => {

        const store = createStore({
            status: {id: "1234", success: true, done: true} as ModelStatusResponse
        });

        const wrapper = shallowMount(ModelRun, {store, localVue});
        expect(wrapper.find("button").attributes().disabled).toBe("disabled");
        expect(wrapper.find(Modal).props().open).toBe(true);
    });

    it("button is enabled once status is success and result exists", () => {
        const store = createStore({
            result: mockModelResultResponse(),
            status: {id: "1234", success: true, done: true} as ModelStatusResponse
        });

        const wrapper = shallowMount(ModelRun, {store, localVue});
        expect(wrapper.find("button").attributes().disabled).toBeUndefined();
        expect(wrapper.find(Modal).props().open).toBe(false);
    });

    it("button is enabled once status is done without success", () => {
        const store = createStore({
            result: mockModelResultResponse(),
            status: {id: "1234", success: false, done: true} as ModelStatusResponse
        });

        const wrapper = shallowMount(ModelRun, {store, localVue});
        expect(wrapper.find("button").attributes().disabled).toBeUndefined();
        expect(wrapper.find(Modal).props().open).toBe(false);
    });

    it("displays message and tick if step is complete", () => {
        const store = createStore({
            result: mockModelResultResponse(),
            status: {id: "1234", success: true, done: true} as ModelStatusResponse
        });
        const wrapper = shallowMount(ModelRun, {store, localVue});
        expect(wrapper.find("#model-run-complete").text()).toBe("Model run complete");
        expect(wrapper.findAll(Tick).length).toBe(1);
    });

    it("does not display message or tick if result is not fetched", () => {
        const store = createStore({
            status: {id: "1234", success: true, done: true} as ModelStatusResponse
        });
        const wrapper = shallowMount(ModelRun, {store, localVue});
        expect(wrapper.findAll("#model-run-complete").length).toBe(0);
        expect(wrapper.findAll(Tick).length).toBe(0);
    });

    it("does not display message or tick if run was successful but error fetching result", () => {
        const store = createStore({status: {success: true} as ModelStatusResponse, errors: ["fetch error"]});
        const wrapper = shallowMount(ModelRun, {store, localVue});
        expect(wrapper.findAll("#model-run-complete").length).toBe(0);
        expect(wrapper.findAll(Tick).length).toBe(0);
    });

    it("displays error alerts for errors", () => {
        const store = createStore({errors: ["first error", "second error"]});
        const wrapper = shallowMount(ModelRun, {store, localVue});
        const errorAlerts = wrapper.findAll("error-alert-stub");
        expect(errorAlerts.length).toBe(2);
        expect(errorAlerts.at(0).attributes("message")).toEqual("first error");
        expect(errorAlerts.at(1).attributes("message")).toEqual("second error");
    });

    it("displays no error alerts if no errors", () => {
        const store = createStore();
        const wrapper = shallowMount(ModelRun, {store, localVue});
        const errorAlerts = wrapper.findAll("error-alert-stub");
        expect(errorAlerts.length).toBe(0);
    });

});
