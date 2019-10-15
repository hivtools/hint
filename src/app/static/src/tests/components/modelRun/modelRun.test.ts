import {createLocalVue, shallowMount} from '@vue/test-utils';
import Vue from 'vue';
import Vuex, {Store} from 'vuex';
import {mockAxios, mockModelResultResponse, mockModelRunState, mockModelStatusResponse, mockSuccess} from "../../mocks";
import ModelRun from "../../../app/components/modelRun/ModelRun.vue";
import {actions} from "../../../app/store/modelRun/actions";
import {mutations} from "../../../app/store/modelRun/mutations";
import {modelRunGetters, ModelRunState} from "../../../app/store/modelRun/modelRun";
import {ModelRunStatus} from "../../../app/store/modelRun/modelRun";
import {RootState} from "../../../app/root";
import Modal from "../../../app/components/Modal.vue";
import Tick from "../../../app/components/Tick.vue";
import {ModelStatusResponse} from "../../../app/generated";

const localVue = createLocalVue();
Vue.use(Vuex);

describe("Model run component", () => {

    const createStore = (state: Partial<ModelRunState> = {}): Store<RootState> => {
        return new Vuex.Store({
            modules: {
                modelRun: {
                    namespaced: true,
                    state: mockModelRunState(state),
                    actions,
                    mutations,
                    getters: modelRunGetters
                }
            }
        });
    };

    mockAxios.onPost(`/model/run/`)
        .reply(200, mockSuccess({id: "1234"}));

    mockAxios.onGet(`/model/status/1234`)
        .reply(200, mockSuccess(mockModelStatusResponse()));

    mockAxios.onGet(`/model/result/1234`)
        .reply(200, mockSuccess(mockModelResultResponse()));


    it("run models and polls for status", (done) => {

        const store = createStore();
        const wrapper = shallowMount(ModelRun, {store, localVue});
        wrapper.find("button").trigger("click");

        setTimeout(() => {
            expect(wrapper.find("button").attributes().disabled).toBe("disabled");
            expect(store.state.modelRun.status).toBe(ModelRunStatus.Started);
            expect(store.state.modelRun.modelRunId).toBe("1234");
            expect(store.state.modelRun.statusPollId).not.toBe(-1);
            expect(wrapper.find(Modal).props().open).toBe(true);

            setTimeout(() => {
                expect(wrapper.find("button").attributes().disabled).toBeUndefined();
                expect(store.state.modelRun.status).toBe(ModelRunStatus.Complete);
                expect(store.state.modelRun.modelRunId).toBe("1234");
                expect(store.state.modelRun.statusPollId).toBe(-1);
                expect(wrapper.find(Modal).props().open).toBe(false);
                done();
            }, 2500);
        });
    });

    it("polls for status if runId already exists", (done) => {
        const store = createStore({modelRunId: "1234"});
        const wrapper = shallowMount(ModelRun, {store, localVue});

        setTimeout(() => {
            expect(wrapper.find("button").attributes().disabled).toBeUndefined();
            expect(store.state.modelRun.status).toBe(ModelRunStatus.Complete);
            expect(store.state.modelRun.modelRunId).toBe("1234");
            expect(store.state.modelRun.statusPollId).toBe(-1);
            expect(wrapper.find(Modal).props().open).toBe(false);
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

    it("button is enabled once status is done", () => {

        const store = createStore({
            status: {id: "1234", done: true} as ModelStatusResponse
        });

        const wrapper = shallowMount(ModelRun, {store, localVue});
        expect(wrapper.find("button").attributes().disabled).toBeUndefined();
        expect(wrapper.find(Modal).props().open).toBe(false);
    });

    it("displays message and tick if run is successful", () => {
        const store = createStore({status: {success: true} as ModelStatusResponse});
        const wrapper = shallowMount(ModelRun, {store, localVue});
        expect(wrapper.find("#model-run-complete").text()).toBe("Model run complete");
        expect(wrapper.findAll(Tick).length).toBe(1);
    });

    it("does not display message or tick if run is not successful", () => {
        const store = createStore({status: {success: false} as ModelStatusResponse});
        const wrapper = shallowMount(ModelRun, {store, localVue});
        expect(wrapper.findAll("#model-run-complete").length).toBe(0);
        expect(wrapper.findAll(Tick).length).toBe(0);
    });

});
