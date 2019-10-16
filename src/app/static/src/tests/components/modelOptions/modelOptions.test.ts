import {createLocalVue, shallowMount} from "@vue/test-utils";
import ModelOptions from "../../../app/components/modelOptions/ModelOptions.vue";
import DynamicForm from "../../../app/components/forms/DynamicForm.vue";
import Vue from "vue";
import Vuex from "vuex";

const localVue = createLocalVue();
Vue.use(Vuex);

describe("Model options component", () => {

    it("displays dynamic form", () => {
        const rendered = shallowMount(ModelOptions);
        expect(rendered.findAll(DynamicForm).length).toBe(1);
    });

    it("dispatches validated action when form submit event is fired", () => {
        const validatedMock = jest.fn();
        const store = new Vuex.Store({
            modules: {
                modelOptions: {
                    namespaced: true,
                    actions: {
                        validated: validatedMock
                    }
                }
            }
        });
        const rendered = shallowMount(ModelOptions, {
            store, localVue
        });
        rendered.find(DynamicForm).vm.$emit("submit");
        expect(validatedMock.mock.calls.length).toBe(1);
    })

});
