import {mount} from "@vue/test-utils";
import Vuex, {ActionTree, MutationTree} from "vuex";
import Vue from "vue";

import ModelOptions from "../../../app/components/modelOptions/ModelOptions.vue";
import {ModelOptionsMutation} from "../../../app/store/modelOptions/mutations";
import {ModelOptionsState} from "../../../app/store/modelOptions/modelOptions";
import {ModelOptionsActions} from "../../../app/store/modelOptions/actions";
import {RootState} from "../../../app/root";
import {mockModelOptionsState} from "../../mocks";
import {DynamicForm} from "@reside-ic/vue-dynamic-form";
import ResetConfirmation from "../../../app/components/ResetConfirmation.vue";
import registerTranslations from "../../../app/store/translations/registerTranslations";

declare var currentUser: string;
currentUser = "guest";

describe("Model options component when edit confirmation is required", () => {

    const mockActions = {
        fetchModelRunOptions: jest.fn()
    };

    const mockMutations = {
        [ModelOptionsMutation.UnValidate]: jest.fn(),
        [ModelOptionsMutation.Update]: jest.fn(),
        [ModelOptionsMutation.Validate]: jest.fn(),
        [ModelOptionsMutation.ModelOptionsFetched]: jest.fn(),
        [ModelOptionsMutation.FetchingModelOptions]: jest.fn()
    };

    const mockGetters = {
        editsRequireConfirmation: () => true,
        laterCompleteSteps: () => [{number: 4, textKey: "runModel"}]
    };

    const createStore = (props: Partial<ModelOptionsState>,
                         mutations: MutationTree<ModelOptionsState> = mockMutations,
                         actions: ModelOptionsActions & ActionTree<ModelOptionsState, RootState> = mockActions) =>{
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
            }
        });
        registerTranslations(store);
        return store;
    };

    const store = createStore({
        valid: true,
        optionsFormMeta: {
            controlSections: [{label: "l1", controlGroups: []}]
        }
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it("opens modal when mousedown event fires", () => {
        const rendered = mount(ModelOptions, {store});
        rendered.find(DynamicForm).trigger("mousedown");
        expect(rendered.find(ResetConfirmation).props("open")).toBe(true);
    });

    // it("closes modal and commits UnValidate mutation if user confirms action", async () => {
    //     const rendered = mount(ModelOptions, {store});
    //     rendered.find(DynamicForm).trigger("mousedown");
    //     rendered.find(ResetConfirmation).find(".btn-white").trigger("click");
    //     await Vue.nextTick();
    //     expect(rendered.find(ResetConfirmation).props("open")).toBe(false);
    //     expect(mockMutations[ModelOptionsMutation.UnValidate].mock.calls.length).toBe(1);
    // });

    it("closes modal and does not commit UnValidate mutation if user cancels action", async () => {
        const rendered = mount(ModelOptions, {store});
        rendered.find(DynamicForm).trigger("mousedown");
        rendered.find(ResetConfirmation).find(".btn-red").trigger("click");
        await Vue.nextTick();
        expect(mockMutations[ModelOptionsMutation.UnValidate].mock.calls.length).toBe(0);
        expect(rendered.find(ResetConfirmation).props("open")).toBe(false);
    });

});
