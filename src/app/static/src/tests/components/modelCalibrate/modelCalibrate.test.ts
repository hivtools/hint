import Vuex, {Store} from "vuex";
import {mockError, mockModelCalibrateState, mockOptionsFormMeta, mockRootState} from "../../mocks";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {RootState} from "../../../app/root";
import {ModelCalibrateState} from "../../../app/store/modelCalibrate/modelCalibrate";
import {mount, shallowMount} from "@vue/test-utils";
import ModelCalibrate from "../../../app/components/modelCalibrate/ModelCalibrate.vue";
import CalibrationResults from "../../../app/components/modelCalibrate/CalibrationResults.vue";
import {DynamicForm} from "@reside-ic/vue-dynamic-form";
import LoadingSpinner from "../../../app/components/LoadingSpinner.vue";
import {expectTranslated} from "../../testHelpers";
import Tick from "../../../app/components/Tick.vue";
import ErrorAlert from "../../../app/components/ErrorAlert.vue";
import {ModelCalibrateMutation} from "../../../app/store/modelCalibrate/mutations";
import { Language } from "../../../app/store/translations/locales";

describe("Model calibrate component", () => {
    const getStore = (state: Partial<ModelCalibrateState> = {}, fetchAction = jest.fn(), submitAction = jest.fn(),
                      updateMutation = jest.fn(), rootState: Partial<RootState> = {}) => {
        const store = new Vuex.Store({
            state: mockRootState(rootState),
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


    it("renders as expected when loading", () => {
        const store = getStore({fetching: true});
        const wrapper = getWrapper(store);
        expect(wrapper.findComponent(LoadingSpinner).exists()).toBe(true);
        expectTranslated(wrapper.findComponent("#loading-message"), "Loading options",
            "Chargement de vos options.", "Opções de carregamento", store);
        expect(wrapper.findComponent(DynamicForm).exists()).toBe(false);
        expect(wrapper.findComponent("#calibration-complete").exists()).toBe(false);
        expect(wrapper.findComponent(ErrorAlert).exists()).toBe(false);
        expect(wrapper.findComponent("#calibrating").exists()).toBe(false);
        expect(wrapper.findComponent("button").exists()).toBe(false);
    });

    it("invokes fetch options action on mount", () => {
        const mockFetch = jest.fn();
        const store = getStore({}, mockFetch);
        getWrapper(store);
        expect(mockFetch.mock.calls.length).toBe(1);
    });

    it("renders options as expected", () => {
        const store = getStore({optionsFormMeta: mockOptionsFormMeta()});
        const wrapper = mount(ModelCalibrate, {store});

        expect(wrapper.findComponent(LoadingSpinner).exists()).toBe(false);
        expect(wrapper.findComponent("#loading-message").exists()).toBe(false);
        const form = wrapper.findComponent(DynamicForm);
        expect(form.props("requiredText")).toBe("required");
        expect(form.props("selectText")).toBe("Select...");
        expect(form.props("includeSubmitButton")).toBe(false);
        expect(form.findComponent("h3").text()).toBe("Test Section");
        expect(form.findComponent(".text-muted").text()).toBe("Just a test section");
        expect((form.findComponent("input").element as HTMLInputElement).value).toBe("5");
        expectTranslated(wrapper.findComponent("button"), "Calibrate", "Calibrer", "Calibrar", store);
        expect(wrapper.findComponent("button").classes()).toContain("btn-submit");
        expect(wrapper.findComponent("button").classes()).not.toContain("btn-secondary");
        expect((wrapper.findComponent("button").element as HTMLButtonElement).disabled).toBe(false);
        expect(wrapper.findComponent("#calibration-complete").exists()).toBe(false);
    });

    it("translates required text", () => {
        const store = getStore({}, jest.fn(), jest.fn(), jest.fn(), {language: Language.fr});
        const wrapper = shallowMount(ModelCalibrate, {store});
        expect(wrapper.findComponent(DynamicForm).props("requiredText")).toBe("obligatoire");
    });

    it("translates select text", () => {
        const store = getStore({}, jest.fn(), jest.fn(), jest.fn(), {language: Language.fr});
        const wrapper = shallowMount(ModelCalibrate, {store});
        expect(wrapper.findComponent(DynamicForm).props("selectText")).toBe("Sélectionner...");
    });

    it("renders calibration complete message", () => {
        const store = getStore({complete: true});
        const wrapper = getWrapper(store);
        expect(wrapper.findComponent("#calibration-complete").findComponent(Tick).exists()).toBe(true);
        expectTranslated(wrapper.findComponent("#calibration-complete h4"), "Calibration complete",
            "Calibrage du modèle terminé", "Calibração concluída", store);
    });

    it("renders error", () => {
        const error = mockError("TEST ERROR");
        const store = getStore({error});
        const wrapper = getWrapper(store);
        expect(wrapper.findComponent(ErrorAlert).props("error")).toBe(error);
    });

    it("renders as expected while calibrating with no progress data", () => {
        const store = getStore({calibrating: true});
        const wrapper = getWrapper(store);
        expect(wrapper.findComponent("#calibrating").findComponent(LoadingSpinner).exists()).toBe(true);
        expectTranslated(wrapper.findComponent("#calibrating"), "Calibrating...",
            "Calibrage en cours...", "Calibrar...", store);
        expect((wrapper.findComponent("button").element as HTMLButtonElement).disabled).toBe(true);
        expect(wrapper.findComponent("button").classes()).toContain("btn-secondary");
        expect(wrapper.findComponent("button").classes()).not.toContain("btn-submit");
    });

    it("renders string progress message", () => {
        const store = getStore({calibrating: true, status: {progress: ["Test progress"]} as any});
        const wrapper = getWrapper(store);
        expect(wrapper.findComponent("#calibrating").text()).toBe("Test progress");
    });

    it("renders ProgressPhase message", () => {
        const store = getStore({calibrating: true, status: {progress: [{name: "Test name", helpText: "Test help"}]} as any});
        const wrapper = getWrapper(store);
        expect(wrapper.findComponent("#calibrating").text()).toBe("Test name: Test help");
    });

    it("setting options value commits update mutation", () => {
        const mockUpdate = jest.fn();
        const store = getStore({optionsFormMeta: mockOptionsFormMeta()}, jest.fn(), jest.fn(), mockUpdate);
        const wrapper = mount(ModelCalibrate, {store});

        wrapper.findComponent(DynamicForm).findComponent("input").setValue("6");
        expect(mockUpdate.mock.calls.length).toBe(1);
        const newFormData = mockUpdate.mock.calls[0][1];
        expect(newFormData.controlSections[0].controlGroups[0].controls[0].value).toBe(6);
    });

    it("clicking Calibrate button invokes submit calibrate action", () => {
        const mockSubmit = jest.fn();
        const store = getStore({optionsFormMeta: mockOptionsFormMeta()}, jest.fn(), mockSubmit);
        const wrapper = mount(ModelCalibrate, {store});
        wrapper.findComponent("button").trigger("click");
        expect(mockSubmit.mock.calls.length).toBe(1);

    });

    it("renders generating calibration results message", () => {
        const store = getStore({complete: true, generatingCalibrationPlot: true});
        const wrapper = getWrapper(store);
        expect(wrapper.findComponent("#genCalibResults").findComponent(LoadingSpinner).exists()).toBe(true);
        expectTranslated(wrapper.findComponent("#genCalibResults span"), "Generating calibration results",
        "Générer des résultats d'étalonnage", "Gerando resultados de calibração", store);
    });

    it("renders calibration plot and label if calibration is complete", () => {
        const store = getStore({complete: true, calibratePlotResult: {}});
        const wrapper = getWrapper(store);
        expect(wrapper.findComponent(CalibrationResults).exists()).toBe(true);
        expectTranslated(wrapper.findComponent("#reviewResults"), "(Review results below)",
        "(Consultez les résultats ci-dessous)", "(Analise os resultados abaixo)", store);
    });

    it("it does not render calibration plot and label if calibration is incomplete", () => {
        const store = getStore({complete: false, calibratePlotResult: {}});
        const wrapper = getWrapper(store);
        expect(wrapper.findComponent(CalibrationResults).exists()).toBe(false);
        expect(wrapper.findComponent("#reviewResults").exists()).toBe(false)
    });
});
