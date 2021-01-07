import Vuex, {ActionTree, MutationTree, Store} from "vuex";
import {mockError, mockModelCalibrateState, mockRootState} from "../../mocks";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {RootState} from "../../../app/root";
import {ModelCalibrateState} from "../../../app/store/modelCalibrate/modelCalibrate";;
import {mount, shallowMount} from "@vue/test-utils";
import ModelCalibrate from "../../../app/components/modelCalibrate/ModelCalibrate.vue";
import {DynamicControlType, DynamicForm} from "@reside-ic/vue-dynamic-form";
import LoadingSpinner from "../../../app/components/LoadingSpinner.vue";
import {expectTranslated} from "../../testHelpers";
import Tick from "../../../app/components/Tick.vue";
import ErrorAlert from "../../../app/components/ErrorAlert.vue";
import {ModelCalibrateMutation} from "../../../app/store/modelCalibrate/mutations";

describe("Model calibrate component", () => {
    const getStore = (state: Partial<ModelCalibrateState> = {}, fetchAction = jest.fn(), submitAction = jest.fn(),
                      updateMutation = jest.fn()) => {
        const store = new Vuex.Store({
            state: mockRootState(),
            modules: {
                modelCalibrate: {
                    namespaced: true,
                    state: mockModelCalibrateState(state),
                    actions: {
                        fetchModelCalibrateOptions: fetchAction,
                        submit: submitAction
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
        expect(wrapper.find(ErrorAlert).exists()).toBe(false);
        expect(wrapper.find("#calibrating").exists()).toBe(false);
        expect(wrapper.find("button").exists()).toBe(false);
    });

    it("invokes fetch options action on mount", () => {
        const mockFetch = jest.fn();
        const store = getStore({}, mockFetch);
        const wrapper = getWrapper(store);
        expect(mockFetch.mock.calls.length).toBe(1);
    });

    it("renders options as expected", () => {
        const store = getStore({optionsFormMeta: mockOptionsFormMeta});
        const wrapper = mount(ModelCalibrate, {store});

        expect(wrapper.find(LoadingSpinner).exists()).toBe(false);
        expect(wrapper.find("#loading-message").exists()).toBe(false);
        const form = wrapper.find(DynamicForm);
        expect(form.attributes("required-text")).toBe("required");
        expect(form.attributes("select-text")).toBe("Select...");
        expect(form.props("includeSubmitButton")).toBe(false);
        expect(form.find("h3").text()).toBe("Test Section");
        expect(form.find(".text-muted").text()).toBe("Just a test section");
        expect((form.find("input").element as HTMLInputElement).value).toBe("5");
        expectTranslated(wrapper.find("button"), "Calibrate", "Calibrer", store);
        expect(wrapper.find("button").classes()).toContain("btn-submit");
        expect(wrapper.find("button").classes()).not.toContain("btn-secondary");
        expect((wrapper.find("button").element as HTMLButtonElement).disabled).toBe(false);
        expect(wrapper.find("#calibration-complete").exists()).toBe(false);
    });

    it("renders calibration complete message", () => {
        const store = getStore({complete: true});
        const wrapper = getWrapper(store);
        expect(wrapper.find("#calibration-complete").find(Tick).exists()).toBe(true);
        expectTranslated(wrapper.find("#calibration-complete h4"), "Calibration complete",
            "Calibrage du modèle terminé", store);
    });

    it("renders error", () => {
        const error = mockError("TEST ERROR");
        const store = getStore({error});
        const wrapper = getWrapper(store);
        expect(wrapper.find(ErrorAlert).props("error")).toBe(error);
    });

    it("renders as expected while calibrating with no progress data", () => {
        const store = getStore({calibrating: true});
        const wrapper = getWrapper(store);
        expect(wrapper.find("#calibrating").find(LoadingSpinner).exists()).toBe(true);
        expectTranslated(wrapper.find("#calibrating"), "Calibrating...",
            "Calibrage en cours...", store);
        expect((wrapper.find("button").element as HTMLButtonElement).disabled).toBe(true);
        expect(wrapper.find("button").classes()).toContain("btn-secondary");
        expect(wrapper.find("button").classes()).not.toContain("btn-submit");
    });

    it("renders string progress message", () => {
        const store = getStore({calibrating: true, status: {progress: ["Test progress"]} as any});
        const wrapper = getWrapper(store);
        expect(wrapper.find("#calibrating").text()).toBe("Test progress");
    });

    it("renders ProgressPhase message", () => {
        const store = getStore({calibrating: true, status: {progress: [{name: "Test name", helpText: "Test help"}]} as any});
        const wrapper = getWrapper(store);
        expect(wrapper.find("#calibrating").text()).toBe("Test name: Test help");
    });

    it("setting options value commits update mutation", () => {
        const mockUpdate = jest.fn();
        const store = getStore({optionsFormMeta: mockOptionsFormMeta}, jest.fn(), jest.fn(), mockUpdate);
        const wrapper = mount(ModelCalibrate, {store});

        wrapper.find(DynamicForm).find("input").setValue("6");
        expect(mockUpdate.mock.calls.length).toBe(1);
        const newFormData = mockUpdate.mock.calls[0][1];
        expect(newFormData.controlSections[0].controlGroups[0].controls[0].value).toBe(6);
    });

    it("clicking Calibrate button invokes submit calibrate action", () => {
        const mockSubmit = jest.fn();
        const store = getStore({optionsFormMeta: mockOptionsFormMeta}, jest.fn(), mockSubmit);
        const wrapper = mount(ModelCalibrate, {store});
        wrapper.find("button").trigger("click");
        expect(mockSubmit.mock.calls.length).toBe(1);

    });
});
