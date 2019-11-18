import {createLocalVue, mount, shallowMount} from "@vue/test-utils";
import ModelOptions from "../../../app/components/modelOptions/ModelOptions.vue";
import DynamicForm from "../../../app/components/forms/DynamicForm.vue";
import Vue from "vue";
import Vuex from "vuex";
import {mockModelOptionsState} from "../../mocks";
import {ModelOptionsState} from "../../../app/store/modelOptions/modelOptions";
import DynamicFormControlSection from "../../../app/components/forms/DynamicFormControlSection.vue";
import {DynamicControlSection} from "../../../app/components/forms/types";
import {ModelOptionsMutation} from "../../../app/store/modelOptions/mutations";

const localVue = createLocalVue();
Vue.use(Vuex);

describe("Model options component", () => {

    const createStore = (props: Partial<ModelOptionsState>, mutations = {}) => new Vuex.Store({
        modules: {
            modelOptions: {
                namespaced: true,
                state: mockModelOptionsState(props),
                mutations
            }
        }
    });

    it("displays dynamic form", () => {
        const store = createStore({optionsFormMeta: {controlSections: []}});
        const rendered = shallowMount(ModelOptions, {store});
        expect(rendered.findAll(DynamicForm).length).toBe(1);
    });

    it("triggers update mutation when dynamic form changes", async () => {
        const updateMock = jest.fn();
        const oldControlSection: DynamicControlSection = {
            label: "label 1",
            controlGroups: []
        };
        const store = createStore({optionsFormMeta: {controlSections: [oldControlSection]}},
            {[ModelOptionsMutation.Update]: updateMock});

        const rendered = mount(ModelOptions, {store});

        const newControlSection: DynamicControlSection = {
            label: "TEST",
            controlGroups: []
        };

        rendered.find(DynamicForm).findAll(DynamicFormControlSection).at(0)
            .vm.$emit("change", newControlSection);

        await Vue.nextTick();
        expect(updateMock.mock.calls[0][1]).toStrictEqual({
            controlSections: [newControlSection]
        });
    });

    it("commits validate mutation when form submit event is fired", () => {
        const validateMock = jest.fn();
        const store = createStore({optionsFormMeta: {controlSections: []}},
            {[ModelOptionsMutation.Validate]: validateMock});
        const rendered = shallowMount(ModelOptions, {
            store, localVue
        });
        rendered.find(DynamicForm).vm.$emit("submit");
        expect(validateMock.mock.calls.length).toBe(1);
    })

});
