import {mount, shallowMount} from "@vue/test-utils";
import Vuex, {ActionTree, MutationTree} from "vuex";
import Vue from "vue";

import ModelOptions from "../../../app/components/modelOptions/ModelOptions.vue";
import {ModelOptionsMutation} from "../../../app/store/modelOptions/mutations";
import {ModelOptionsState} from "../../../app/store/modelOptions/modelOptions";
import {ModelOptionsActions} from "../../../app/store/modelOptions/actions";
import {RootState} from "../../../app/root";
import {mockModelOptionsState} from "../../mocks";
import DynamicFormControlSection from "../../../app/components/forms/DynamicFormControlSection.vue";
import DynamicForm from "../../../app/components/forms/DynamicForm.vue";
import ResetConfirmation from "../../../app/components/ResetConfirmation.vue";
import LoadingSpinner from "../../../app/components/LoadingSpinner.vue";

Vue.use(Vuex);

describe("Model options component when edit confirmation is required", () => {

    const mockActions = {
        fetchModelRunOptions: jest.fn()
    };

    const mockMutations = {
        [ModelOptionsMutation.Update]: jest.fn(),
        [ModelOptionsMutation.Validate]: jest.fn(),
        [ModelOptionsMutation.ModelOptionsFetched]: jest.fn(),
        [ModelOptionsMutation.FetchingModelOptions]: jest.fn()
    };

    const mockGetters = {
        editsRequireConfirmation: () => true,
        laterCompleteSteps: () => [{number: 4, text: "Run model"}]
    };

    const createStore = (props: Partial<ModelOptionsState>,
                         mutations: MutationTree<ModelOptionsState> = mockMutations,
                         actions: ModelOptionsActions & ActionTree<ModelOptionsState, RootState> = mockActions) => new Vuex.Store({
        modules: {
            modelOptions: {
                namespaced: true,
                state: mockModelOptionsState(props),
                mutations,
                actions
            },
            stepper: {
                namespaced: true,
                getters: mockGetters
            }
        }
    });

    const store = createStore({
        valid: true,
        optionsFormMeta: {
            controlSections: [{label: "l1", controlGroups: []}]
        }
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it("opens modal when edit is made", () => {
        const rendered = mount(ModelOptions, {store});
        rendered.find(DynamicForm).findAll(DynamicFormControlSection).at(0)
            .vm.$emit("change", {label: "whatever", controlGroups: []});

        expect(rendered.find(ResetConfirmation).props("open")).toBe(true);
    });

    it("commits change if user confirms action", async () => {
        const newControlSection = {label: "whatever", controlGroups: []};
        const rendered = mount(ModelOptions, {store});
        rendered.find(DynamicForm).findAll(DynamicFormControlSection).at(0)
            .vm.$emit("change", newControlSection);

        rendered.find(ResetConfirmation).find(".btn-white").trigger("click");
        await Vue.nextTick();
        expect(mockMutations[ModelOptionsMutation.Update].mock.calls[0][1]).toStrictEqual({
            controlSections: [newControlSection]
        });
    });

    it("does not commit change if user cancels action", async () => {
        const newControlSection = {label: "whatever", controlGroups: []};
        const rendered = mount(ModelOptions, {store});
        rendered.find(DynamicForm).findAll(DynamicFormControlSection).at(0)
            .vm.$emit("change", newControlSection);

        rendered.find(ResetConfirmation).find(".btn-red").trigger("click");
        await Vue.nextTick();
        expect(mockMutations[ModelOptionsMutation.Update].mock.calls.length).toBe(0);
        expect(rendered.find(ResetConfirmation).props("open")).toBe(false);
    });

    it("reloads the form if user cancels action", (done) => {
        const newControlSection = {label: "whatever", controlGroups: []};
        const rendered = mount(ModelOptions, {store});
        rendered.find(DynamicForm).findAll(DynamicFormControlSection).at(0)
            .vm.$emit("change", newControlSection);

        rendered.find(ResetConfirmation).find(".btn-red").trigger("click");
        expect(rendered.vm.$data.reloading).toBe(true);

        setTimeout(() => {
            expect(rendered.vm.$data.reloading).toBe(false);
            expect(rendered.find(ResetConfirmation).props("open")).toBe(false);
            done();
        })
    });

    it("loading spinner is shown if reloading is true", () => {
        const rendered = shallowMount(ModelOptions, {store});
        rendered.setData({reloading: true});
        expect(rendered.findAll(DynamicForm).length).toBe(0);
        expect(rendered.findAll(LoadingSpinner).length).toBe(1);
    });

});
