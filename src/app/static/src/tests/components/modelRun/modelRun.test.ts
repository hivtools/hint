import {createLocalVue, shallowMount} from '@vue/test-utils';
import Vue from 'vue';
import Vuex from 'vuex';
import {mockModelRunState} from "../../mocks";
import ModelRun from "../../../app/components/modelRun/ModelRun.vue";
import {ModelRunStatus} from "../../../app/store/modelRun/modelRun";

const localVue = createLocalVue();
Vue.use(Vuex);

describe("Model run component", () => {

    it("can run model", () => {

        const actions = {
            run: jest.fn(),
        };

        const store = new Vuex.Store({
            modules: {
                modelRun: {
                    namespaced: true,
                    state: mockModelRunState(),
                    actions
                }
            }
        });

        const wrapper = shallowMount(ModelRun, {store, localVue});
        wrapper.find("button").trigger("click");
        expect(actions.run.mock.calls.length).toBe(1);
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
