import {createLocalVue, shallowMount} from "@vue/test-utils";
import ModelOptions from "../../../app/components/modelOptions/ModelOptions.vue";
import DynamicForm from "../../../app/components/forms/DynamicForm.vue";
import Vue from "vue";
import Vuex from "vuex";
import {mockModelOptionsState} from "../../mocks";
import {ModelOptionsState} from "../../../app/store/modelOptions/modelOptions";

const localVue = createLocalVue();
Vue.use(Vuex);

describe("Model options component", () => {

    const createStore = (props: Partial<ModelOptionsState>) => new Vuex.Store({
        modules: {
            modelOptions: {
                namespaced: true,
                state: mockModelOptionsState(props)
            }
        }
    });

    it("displays dynamic form", () => {
        const store = createStore({optionsFormMeta: {controlSections: []}});
        const rendered = shallowMount(ModelOptions, {store});
        expect(rendered.findAll(DynamicForm).length).toBe(1);
    });

    it("commits valid mutation when form submit event is fired", () => {
        const validateMock = jest.fn();
        const store = new Vuex.Store({
            modules: {
                modelOptions: {
                    namespaced: true,
                    mutations: {
                        validate: validateMock
                    },
                    state: mockModelOptionsState({optionsFormMeta: {controlSections: []}})
                }
            }
        });
        const rendered = shallowMount(ModelOptions, {
            store, localVue
        });
        rendered.find(DynamicForm).vm.$emit("submit");
        expect(validateMock.mock.calls.length).toBe(1);
    })

});
