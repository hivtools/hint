import {createLocalVue, shallowMount} from '@vue/test-utils';
import Vue from 'vue';
import Vuex from 'vuex';
import {mockAxios, mockModelRunState, mockModelStatusResponse, mockSuccess} from "../../mocks";
import ModelRun from "../../../app/components/modelRun/ModelRun.vue";
import {actions} from "../../../app/store/modelRun/actions";
import {mutations} from "../../../app/store/modelRun/mutations";
import {ModelRunState} from "../../../app/store/modelRun/modelRun";
import {ModelRunStatus} from "../../../app/store/modelRun/modelRun";

const localVue = createLocalVue();
Vue.use(Vuex);

describe("Model run component", () => {

    const createStore = (state: Partial<ModelRunState> = {}) => {
        return new Vuex.Store({
            modules: {
                modelRun: {
                    namespaced: true,
                    state: mockModelRunState(state),
                    actions,
                    mutations
                }
            }
        });

    };

    mockAxios.onPost(`/model/run/`)
        .reply(200, mockSuccess({id: "1234"}));

    mockAxios.onGet(`/model/status/1234`)
        .reply(200, mockSuccess(mockModelStatusResponse()));

    it("run models and polls for status", (done) => {

        const store = createStore();
        const wrapper = shallowMount(ModelRun, {store, localVue});
        wrapper.find("button").trigger("click");

        setTimeout(() => {
            expect(wrapper.find("button").attributes().disabled).toBe("disabled");
            expect(store.state.modelRun.status).toBe(ModelRunStatus.Started);
            expect(store.state.modelRun.modelRunId).toBe("1234");
            expect(store.state.modelRun.statusPollId).not.toBe(-1);

            setTimeout(() => {
                expect(wrapper.find("button").attributes().disabled).toBeUndefined();
                expect(store.state.modelRun.status).toBe(ModelRunStatus.Complete);
                expect(store.state.modelRun.modelRunId).toBe("1234");
                expect(store.state.modelRun.statusPollId).toBe(-1);
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
            done();
        }, 2500);
    });

    it("button is disabled if status is started", () => {

        const actions = {
            run: jest.fn(),
        };

        const store = new Vuex.Store({
            modules: {
                modelRun: {
                    namespaced: true,
                    state: mockModelRunState({
                        status: ModelRunStatus.Started
                    }),
                    actions
                }
            }
        });

        const wrapper = shallowMount(ModelRun, {store, localVue});
        expect(wrapper.find("button").attributes().disabled).toBe("disabled");
    });

});
