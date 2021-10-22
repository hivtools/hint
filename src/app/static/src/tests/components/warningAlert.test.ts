import {createLocalVue, shallowMount, Wrapper} from '@vue/test-utils';
import WarningAlert from "../../app/components/WarningAlert.vue";
import Vue from "vue";
import Vuex from "vuex";
import {emptyState} from "../../app/root";
import registerTranslations from "../../app/store/translations/registerTranslations";
import {expectTranslated} from "../testHelpers";

const localVue = createLocalVue();

describe("Warning alert component", () => {

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

    function setDivHeights(wrapper: Wrapper<Vue>, l: number, hpl: number, wb: number) {
        // const line = wrapper.vm.$refs.line as HTMLDivElement;
        // const headerPlusLine = wrapper.vm.$refs.headerPlusLine as HTMLDivElement;
        // const warningBox = wrapper.vm.$refs.warningBox as HTMLDivElement;
        // jest.spyOn(line, "clientHeight", "get")
        //     .mockImplementation(() => 1000);
        // jest.spyOn(headerPlusLine, "clientHeight", "get")
        //         .mockImplementation(() => 1000);
        // jest.spyOn(warningBox, "clientHeight", "get")
        //     .mockImplementation(() => 1000);
        function internal(refName: string, height: number){
            const selDiv = wrapper.vm.$refs[refName] as HTMLDivElement;
            jest.spyOn(selDiv, "clientHeight", "get")
                .mockImplementation(() => height);
        }
        internal("line", l)
        internal("headerPlusLine", hpl)
        internal("warningBox", wb)
    }

    it("renders no warning alert if there are no warnings", () => {
        const wrapper = createWrapper({ modelOptions: [], modelRun: [], modelCalibrate: []})
        expect(wrapper.find(".alert-warning").exists()).toBe(false);
    });

    it("renders warning messages", () => {
        const wrapper = createWrapper()

        expect(wrapper.find(".alert-warning").exists()).toBe(true);
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

        const hiddenWarning = wrapper.find(".invisible")
        expect(hiddenWarning.find("h4").find("alert-triangle-icon-stub").exists()).toBe(true);
        expect(hiddenWarning.find("h4").text()).toBe("Hidden header");
        expect(hiddenWarning.find("p").text()).toBe("...");
    });

    it("renders ellipsis and show more/less buttons if many warnings", async () => {
        const wrapper = createWrapper()
        // wrapper.setData({
        //     fullBoxHeight: 232,
        //     lineHeight: 24,
        //     headerHeight: 56
        // })
        setDivHeights(wrapper, 24, 56, 232)
        wrapper.setProps({ warnings: {...warningsMock}})
        const showToggle = wrapper.find("#showToggle")
        expect(showToggle.find("p").text()).toBe("...")
        expectTranslated(showToggle.find("button"), 
            "Show more", 
            "Montrer plus", 
            "Mostre mais", 
        store)
        await showToggle.find("button").trigger("click")
        expect(wrapper.find("#showToggle>p").exists()).toBe(false)
        expectTranslated(showToggle.find("button"), 
            "Show less", 
            "Montrer moins", 
            "Mostre menos", 
        store)
    });

    it("does not show more/less buttons if few warnings", async () => {
        const wrapper = createWrapper()
        setDivHeights(wrapper, 24, 56, 104)
        wrapper.setProps({ warnings: {...warningsMock}})
        expect(wrapper.find("#showToggle").exists()).toBe(false)
    });

    it("only renders warning messages that have warnings", () => {
        const wrapper = createWrapper({
            modelOptions: [],
            modelRun: [{ text: 'model run warning', locations: []}],
            modelCalibrate: []
        })

        expect(wrapper.find(".alert-warning").exists()).toBe(true);
        const warnings = wrapper.findAll("#warningBox>div")
        expect(warnings.length).toBe(1);
      
        const modelRunWarning = warnings.at(0)
        expectTranslated(modelRunWarning.find("h4"), 
            "Model fit raised the following warning(s)", 
            "L'ajustement du modèle a soulevé le(s) avertissement(s) suivant(s)", 
            "O ajuste do modelo gerou o seguinte aviso (s)", 
        store)
        expect(modelRunWarning.find("h4").find("alert-triangle-icon-stub").exists()).toBe(true);
        expect(modelRunWarning.findAll("li").length).toBe(1);
        expect(modelRunWarning.findAll("li").at(0).text()).toBe("model run warning");
    });

})