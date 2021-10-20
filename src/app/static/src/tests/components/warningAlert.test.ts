import {createLocalVue, shallowMount} from '@vue/test-utils';
import WarningAlert from "../../app/components/WarningAlert.vue";
import Vuex from "vuex";
import {emptyState} from "../../app/root";
import registerTranslations from "../../app/store/translations/registerTranslations";
import {expectTranslated} from "../testHelpers";

const localVue = createLocalVue();

describe("Warning alert component", () => {

    // const createStore = () => {
    //     return new Vuex.Store({})
    // };

    const warningsMock = {
        modelOptions: [{ text: 'a warning', locations: []}, { text: 'another warning', locations: []}, { text: 'third warning', locations: []}, { text: 'final warning', locations: []}],
        modelRun: [{ text: 'model run warning', locations: []}],
        modelCalibrate: [{ text: 'calibrate warning', locations: []}]
    }

    const store = new Vuex.Store({state: emptyState()});
    registerTranslations(store);

    const createWrapper = (warnings = warningsMock) => {
        const wrapper = shallowMount(WarningAlert, {
            propsData: {
                warnings: warnings
            },
            store,
            localVue
        });
        return wrapper
    }

    it("renders warning messages", () => {
        const wrapper = createWrapper()

        expect(wrapper.find(".alert-warning").exists()).toBe(true);
        const warningBox = wrapper.find("#warningBox")
        const warnings = wrapper.findAll("#warningBox>div")
        expect(warnings.length).toBe(3);

        const modelOptionsWarning = warnings.at(0)
        expectTranslated(modelOptionsWarning.find("h4"), 
            "Model option validation raised the following warning(s)", 
            "La validation de l'option de modèle a généré le(s) avertissement(s) suivant(s)", 
            "A validação da opção de modelo gerou o (s) seguinte (s) aviso (s)", 
        store)
        expect(modelOptionsWarning.find("h4").find("alert-triangle-icon-stub").exists()).toBe(true);
        expect(modelOptionsWarning.findAll("li").length).toBe(4);
        expect(modelOptionsWarning.findAll("li").at(0).text()).toBe("a warning");
        expect(modelOptionsWarning.findAll("li").at(1).text()).toBe("another warning");
        expect(modelOptionsWarning.findAll("li").at(2).text()).toBe("third warning");
        expect(modelOptionsWarning.findAll("li").at(3).text()).toBe("final warning");
      
        const modelRunWarning = warnings.at(1)
        expectTranslated(modelRunWarning.find("h4"), 
            "Model fit raised the following warning(s)", 
            "L'ajustement du modèle a soulevé le(s) avertissement(s) suivant(s)", 
            "O ajuste do modelo gerou o seguinte aviso (s)", 
        store)
        expect(modelRunWarning.find("h4").find("alert-triangle-icon-stub").exists()).toBe(true);
        expect(modelRunWarning.findAll("li").length).toBe(1);
        expect(modelRunWarning.findAll("li").at(0).text()).toBe("model run warning");

        const modelCalibrateWarning = warnings.at(2)
        expectTranslated(modelCalibrateWarning.find("h4"), 
            "Model calibration raised the following warning(s)", 
            "L'étalonnage du modèle a déclenché le(s) avertissement(s) suivant(s)", 
            "A calibração do modelo gerou o (s) seguinte (s) aviso (s)", 
        store)
        expect(modelCalibrateWarning.find("h4").find("alert-triangle-icon-stub").exists()).toBe(true);
        expect(modelCalibrateWarning.findAll("li").length).toBe(1);
        expect(modelCalibrateWarning.findAll("li").at(0).text()).toBe("calibrate warning");
    });

    it("renders no warning alert if there are no warnings", () => {
        const wrapper = createWrapper({ modelOptions: [], modelRun: [], modelCalibrate: []})
        expect(wrapper.find(".alert-warning").exists()).toBe(false);
    });

})