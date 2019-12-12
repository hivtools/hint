import {createLocalVue, mount, shallowMount} from "@vue/test-utils";
import ModelOptions from "../../../app/components/modelOptions/ModelOptions.vue";
import DynamicForm from "../../../app/components/forms/DynamicForm.vue";
import Vue from "vue";
import Vuex, {ActionTree, MutationTree} from "vuex";
import {mockModelOptionsState} from "../../mocks";
import {ModelOptionsState} from "../../../app/store/modelOptions/modelOptions";
import DynamicFormControlSection from "../../../app/components/forms/DynamicFormControlSection.vue";
import {DynamicControlSection} from "../../../app/components/forms/types";
import {ModelOptionsMutation} from "../../../app/store/modelOptions/mutations";
import LoadingSpinner from "../../../app/components/LoadingSpinner.vue";
import Tick from "../../../app/components/Tick.vue";
import {ModelOptionsActions} from "../../../app/store/modelOptions/actions";
import {emptyState, RootState} from "../../../app/root";
import {expectTranslatedText} from "../../testHelpers";
import {Language} from "../../../app/store/translations/locales";
import {actions} from "../../../app/store/root/actions";
import {mutations} from "../../../app/store/root/mutations";

const localVue = createLocalVue();

describe("Model options component", () => {

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
        editsRequireConfirmation: () => false,
        laterCompleteSteps: () => [{number: 4, text: "Run model"}]
    };

    const createStore = (props: Partial<ModelOptionsState>,
                         modelOptionsMutations: MutationTree<ModelOptionsState> = mockMutations,
                         modelOptionsActions: ModelOptionsActions & ActionTree<ModelOptionsState, RootState> = mockActions) => new Vuex.Store({
        state: emptyState(),
        actions,
        mutations,
        modules: {
            modelOptions: {
                namespaced: true,
                state: mockModelOptionsState(props),
                mutations: modelOptionsMutations,
                actions: modelOptionsActions
            },
            stepper: {
                namespaced: true,
                getters: mockGetters
            }
        }
    });

    it("displays dynamic form when fetching is false", () => {
        const store = createStore({optionsFormMeta: {controlSections: []}});
        const rendered = shallowMount(ModelOptions, {store});
        expect(rendered.findAll(DynamicForm).length).toBe(1);
        expect(rendered.findAll(LoadingSpinner).length).toBe(0);
    });

    it("passes translated submitText to dynamic form", async () => {
        const store = createStore({optionsFormMeta: {controlSections: []}});
        const rendered = mount(ModelOptions, {store});
        expect(rendered.find(DynamicForm).props("submitText")).toBe("Validate");
        await store.dispatch("changeLanguage", Language.fr);
        expect(rendered.find(DynamicForm).props("submitText")).toBe("Valider");
    });

    it("displays loading spinner while fetching is true", () => {
        const store = createStore({fetching: true});
        const rendered = shallowMount(ModelOptions, {store});
        expect(rendered.findAll(DynamicForm).length).toBe(0);
        expect(rendered.findAll(LoadingSpinner).length).toBe(1);
        expectTranslatedText(rendered.find("#loading-message"), "Loading options");
    });

    it("displays tick and message if valid is true", () => {
        const store = createStore({valid: true});
        const rendered = shallowMount(ModelOptions, {store});
        expectTranslatedText(rendered.find("h4"), "Options are valid");
        expect(rendered.findAll(Tick).length).toBe(1);
    });

    it("does not display tick or message if valid is false", () => {
        const store = createStore({valid: false});
        const rendered = shallowMount(ModelOptions, {store});
        expect(rendered.findAll("h4").length).toBe(0);
        expect(rendered.findAll(Tick).length).toBe(0);
    });

    it("triggers update mutation when dynamic form changes", async () => {
        const updateMock = jest.fn();
        const oldControlSection: DynamicControlSection = {
            label: "label 1",
            controlGroups: []
        };

        const store = createStore(
            {
                optionsFormMeta: {controlSections: [oldControlSection]}
            },
            {
                [ModelOptionsMutation.Update]: updateMock
            });

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

        const store = createStore(
            {
                optionsFormMeta: {controlSections: []}
            },
            {
                ...mockMutations,
                [ModelOptionsMutation.Validate]: validateMock
            });

        const rendered = shallowMount(ModelOptions, {
            store, localVue
        });
        rendered.find(DynamicForm).vm.$emit("submit");
        expect(validateMock.mock.calls.length).toBe(1);
    });

    it("dispatches fetch event on mount", () => {
        const fetchMock = jest.fn();
        const store = createStore({}, mockMutations, {fetchModelRunOptions: fetchMock});
        shallowMount(ModelOptions, {
            store, localVue
        });
        expect(fetchMock.mock.calls.length).toBe(1);
    });

});
