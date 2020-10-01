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
import Tick from "../../../app/components/Tick.vue";
import {ModelCalibrateMutation} from "../../../app/store/modelCalibrate/mutations";

describe("Model calibrate component", () => {
    const getStore = (state: Partial<ModelCalibrateState> = {}, fetchAction = jest.fn(),
                      updateMutation = jest.fn()) => {
        const store = new Vuex.Store({
            state: mockRootState(),
            modules: {
                modelCalibrate: {
                    namespaced: true,
                    state: mockModelCalibrateState(state),
                    getters: modelCalibrateGetters,
                    actions: {
                        fetchModelCalibrateOptions: fetchAction
                    },
                    mutations: {
                        [ModelCalibrateMutation.Update]: updateMutation
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

    const mockOptionsFormMeta = {
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
        const store = getStore({optionsFormMeta: mockOptionsFormMeta});
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

    it("renders calibration complete message", () => {
        const store = getStore({complete: true});
        const wrapper = getWrapper(store);
        expect(wrapper.find("#calibration-complete").find(Tick).exists()).toBe(true);
        expectTranslated(wrapper.find("#calibration-complete h4"), "Calibration complete",
            "Calibrage du modèle terminé", store);
    });

    it("setting options value commits update mutation", () => {
        const mockUpdate = jest.fn();
        const store = getStore({optionsFormMeta: mockOptionsFormMeta}, jest.fn(), mockUpdate);
        const wrapper = mount(ModelCalibrate, {store});

        wrapper.find(DynamicForm).find("input").setValue("6");
        expect(mockUpdate.mock.calls.length).toBe(1);
        const newFormData = mockUpdate.mock.calls[0][1];
        expect(newFormData.controlSections[0].controlGroups[0].controls[0].value).toBe(6);
    });

    it("clicking Calibrate button invokes calibrate action", () => {

    });
});
