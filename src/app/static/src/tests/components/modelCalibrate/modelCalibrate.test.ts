import Vuex, {ActionTree, MutationTree, Store} from "vuex";
import {mockModelCalibrateState, mockRootState} from "../../mocks";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {RootState} from "../../../app/root";
import {ModelCalibrateState, modelCalibrateGetters} from "../../../app/store/modelCalibrate/modelCalibrate";;
import {mount, shallowMount} from "@vue/test-utils";
import ModelCalibrate from "../../../app/components/modelCalibrate/ModelCalibrate.vue";
import {DynamicControlType, DynamicForm} from "@reside-ic/vue-dynamic-form";
import LoadingSpinner from "../../../app/components/LoadingSpinner.vue";
import {expectTranslated} from "../../testHelpers";

describe("Model calibrate component", () => {
    const getStore = (state: Partial<ModelCalibrateState> = {}, fetchAction = jest.fn()) => {
        const store = new Vuex.Store({
            state: mockRootState(),
            modules: {
                modelCalibrate: {
                    namespaced: true,
                    state: mockModelCalibrateState(state),
                    getters: modelCalibrateGetters,
                    actions: {
                        fetchModelCalibrateOptions: fetchAction
                    }
                }
            }
        });
        registerTranslations(store);
        return store;
    };

    const getWrapper = (store: Store<RootState>) => {
        return shallowMount(ModelCalibrate, {store});
    };

    it("renders as expected when loading", () => {
        const store = getStore({fetching: true});
        const wrapper = getWrapper(store);
        expect(wrapper.find(LoadingSpinner).exists()).toBe(true);
        expectTranslated(wrapper.find("#loading-message"), "Loading options",
            "Chargement de vos options.", store);
        expect(wrapper.find(DynamicForm).exists()).toBe(false);
        expect(wrapper.find("#calibration-complete").exists()).toBe(false);
    });

    it("renders options as expected", () => {
        const optionsFormMeta = {
            controlSections: [{
                label: "Test Section",
                description: "Just a test section",
                controlGroups: [{
                    controls: [{
                        name: "TestValue",
                        type: "number" as DynamicControlType,
                        required: false,
                        min: 0,
                        max: 10,
                        value: 5
                    }]
                }]
            }]
        };
        const store = getStore({optionsFormMeta});
        const wrapper = mount(ModelCalibrate, {store});

        expect(wrapper.find(LoadingSpinner).exists()).toBe(false);
        expect(wrapper.find("#loading-message").exists()).toBe(false);
        const form = wrapper.find(DynamicForm);
        expect(form.attributes("required-text")).toBe("required");
        expect(form.attributes("select-text")).toBe("Select...");
        expect(form.props("submitText")).toBe("Calibrate");
        expect(form.find("h3").text()).toBe("Test Section");
        expect(form.find(".text-muted").text()).toBe("Just a test section");
        expect((form.find("input").element as HTMLInputElement).value).toBe("5");
        expect(wrapper.find("#calibration-complete").exists()).toBe(false);
    });
});
