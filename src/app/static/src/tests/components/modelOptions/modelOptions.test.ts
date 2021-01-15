import {mount, shallowMount} from "@vue/test-utils";
import ModelOptions from "../../../app/components/modelOptions/ModelOptions.vue";
import {DynamicForm} from "@reside-ic/vue-dynamic-form";
import Vue from "vue";
import Vuex, {ActionTree, MutationTree} from "vuex";
import {mockError, mockModelOptionsState, mockRootState} from "../../mocks";
import {ModelOptionsState} from "../../../app/store/modelOptions/modelOptions";
import {DynamicControlSection} from "@reside-ic/vue-dynamic-form";
import {ModelOptionsMutation} from "../../../app/store/modelOptions/mutations";
import LoadingSpinner from "../../../app/components/LoadingSpinner.vue";
import Tick from "../../../app/components/Tick.vue";
import {ModelOptionsActions} from "../../../app/store/modelOptions/actions";
import {RootState} from "../../../app/root";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {getters} from "../../../app/store/root/getters";
import {expectTranslated} from "../../testHelpers";
import ErrorAlert from "../../../app/components/ErrorAlert.vue";

describe("Model options component", () => {

    const mockActions = {
        fetchModelRunOptions: jest.fn(),
        validateModelOptions: jest.fn()
    };
    const mockMutations = {
        [ModelOptionsMutation.Update]: jest.fn(),
        [ModelOptionsMutation.Validate]: jest.fn(),
        [ModelOptionsMutation.ModelOptionsFetched]: jest.fn(),
        [ModelOptionsMutation.FetchingModelOptions]: jest.fn(),
        [ModelOptionsMutation.Validating]: jest.fn(),
        [ModelOptionsMutation.ModelOptionsError]: jest.fn()
    };

    const mockGetters = {
        editsRequireConfirmation: () => false,
        changesToRelevantSteps: () => [{number: 4, textKey: "fitModel"}]
    };

    const createStore = (props: Partial<ModelOptionsState>,
                         mutations: MutationTree<ModelOptionsState> = mockMutations,
                         actions: ModelOptionsActions & ActionTree<ModelOptionsState, RootState> = mockActions) => {
        const store = new Vuex.Store({
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
                },
                projects: {
                    namespaced: true
                },
                errors: {
                    namespaced: true
                }
            },
            getters: getters,
            state: mockRootState({currentUser: 'guest'})
        });
        registerTranslations(store);
        return store;
    };

    it("displays dynamic form when fetching is false", () => {
        const store = createStore({optionsFormMeta: {controlSections: []}});
        const rendered = shallowMount(ModelOptions, {store});
        expect(rendered.findAll(DynamicForm).length).toBe(1);
        const form = rendered.find(DynamicForm);
        expect(form.props("requiredText")).toBe("required");
        expect(form.props("selectText")).toBe("Select...");
        expect(rendered.findAll(LoadingSpinner).length).toBe(0);
        expect(rendered.find("#validating").exists()).toBe(false);
    });

    it("displays loading spinner while fetching is true", () => {
        const store = createStore({fetching: true});
        const rendered = shallowMount(ModelOptions, {store});
        expect(rendered.findAll(DynamicForm).length).toBe(0);
        expect(rendered.findAll(LoadingSpinner).length).toBe(1);
        expectTranslated(rendered.find("#loading-message"), "Loading options",
            "Chargement de vos options.", store);
    });

    it("renders as expected while validating", () => {
        const store = createStore({validating: true});
        const rendered = shallowMount(ModelOptions, {store});
        expect(rendered.find("#validating").find(LoadingSpinner).exists()).toBe(true);
        expectTranslated(rendered.find("#validating"), "Validating...",
            "Validation en cours...", store);
    });

    it("displays tick and message if valid is true", () => {
        const store = createStore({valid: true});
        const rendered = shallowMount(ModelOptions, {store});
        expectTranslated(rendered.find("h4"), "Options are valid",
            "Les options sont valides", store);
        expect(rendered.findAll(Tick).length).toBe(1);
        expect(rendered.find("#validating").exists()).toBe(false);
    });


    it("does not display tick or message if valid is false", () => {
        const store = createStore({valid: false});
        const rendered = shallowMount(ModelOptions, {store});
        expect(rendered.findAll("h4").length).toBe(0);
        expect(rendered.findAll(Tick).length).toBe(0);
    });

    it("does display error message when error occurred", () => {
        const error = mockError("validation error occurred")
        const store = createStore({validateError: error});
        const rendered = shallowMount(ModelOptions, {store});
        expect(rendered.findAll(ErrorAlert).length).toBe(1);
        expect(rendered.find(ErrorAlert).props().error).toBe(error);
    })

    it("does display error message when model option encounter Errors", () => {
        const error = mockError("Errors")
        const store = createStore({optionsError: error});
        const rendered = shallowMount(ModelOptions, {store});
        expect(rendered.findAll(ErrorAlert).length).toBe(1);
        expect(rendered.find(ErrorAlert).props().error).toBe(error);
    })

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

        rendered.find(DynamicForm).vm.$emit("change", {controlSections: [newControlSection]});

        await Vue.nextTick();
        expect(updateMock.mock.calls[0][1]).toStrictEqual({
            controlSections: [newControlSection]
        });
    });

    it("dispatches fetch run option event when form submit event is fired", () => {
        const fetchMock = jest.fn();
        const store = createStore({}, mockMutations, {

            ...mockActions,
            fetchModelRunOptions: fetchMock

        });
        const rendered = shallowMount(ModelOptions, {
            store
        });

        expect(fetchMock.mock.calls.length).toBe(1);
    });

    it("dispatches validation event when form submit event is fired", async () => {
        const validateMock = jest.fn();
        const store = createStore({}, mockMutations, {

            ...mockActions,
            validateModelOptions: validateMock

        });
        const rendered = shallowMount(ModelOptions, {
            store
        });
        rendered.find(DynamicForm).vm.$emit("submit");

        await Vue.nextTick();
        expect(validateMock.mock.calls.length).toBe(1);
    });
});
