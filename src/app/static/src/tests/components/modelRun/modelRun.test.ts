import {createLocalVue, shallowMount} from '@vue/test-utils';
import Vue from 'vue';
import Vuex from 'vuex';
import {mockModelRunState} from "../../mocks";
import ModelRun from "../../../app/components/modelRun/ModelRun.vue";

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

});
