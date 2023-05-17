import {shallowMount, Wrapper} from '@vue/test-utils';
import Warning from "../../app/components/Warning.vue";
import Vue from "vue";
import Vuex from "vuex";
import {emptyState} from "../../app/root";
import registerTranslations from "../../app/store/translations/registerTranslations";
import {expectTranslated} from "../testHelpers";

describe("Warning component", () => {

    const mockPropsModelOptions = {
        origin: "modelOptions",
        warnings: [{ text: 'a warning', locations: []}, { text: 'another warning', locations: []}, { text: 'third warning', locations: []}, { text: 'final warning', locations: []}]
    }

    const mockPropsModelRun = {
        origin: "modelRun",
        warnings: [{ text: 'model run warning', locations: []}]
    }

    const mockPropsReviewInputs = {
        origin: "reviewInputs",
        warnings: [{ text: 'review input warning', locations: []}]
    }

    const mockPropsModelCalibrate = {
        origin: "modelCalibrate",
        warnings: [{ text: 'calibrate warning', locations: []}]
    }

    const store = new Vuex.Store({state: emptyState()});
    registerTranslations(store);

    const createWrapper = (props = mockPropsModelOptions) => {
        const wrapper = shallowMount(Warning, {
            props,
            store
        });
        return wrapper
    }

    function setDivHeights(wrapper: Wrapper<Vue>, l: number, wb: number) {
        function internal(refName: string, height: number){
            const selDiv = wrapper.vm.$refs[refName] as HTMLDivElement;
            jest.spyOn(selDiv, "clientHeight", "get")
                .mockImplementation(() => height);
        }
        internal("line", l)
        internal("warningBox", wb)
    }

    it("empty warnings are not rendered and setIntervals are cleared", () => {
        const wrapper = createWrapper({origin: "anything", warnings: []})
        expect(wrapper.findComponent("div").exists()).toBe(false);
    });

    it("renders warning messages", () => {
        const wrapper = createWrapper()
        expectTranslated(wrapper.findComponent("h5"), 
            "Model option validation raised the following warning(s)", 
            "La validation de l'option de modèle a généré le(s) avertissement(s) suivant(s)", 
            "A validação da opção de modelo gerou o (s) seguinte (s) aviso (s)", 
        store)
        expect(wrapper.findComponent("h5").findComponent("alert-triangle-icon-stub").exists()).toBe(true);
        expect(wrapper.findAllComponents("li").length).toBe(4);
        expect(wrapper.findComponent("li > div").attributes("style")).toBeUndefined();
        expect(wrapper.findAllComponents("li")[0].text()).toBe("a warning");
        expect(wrapper.findAllComponents("li")[1].text()).toBe("another warning");
        expect(wrapper.findAllComponents("li")[2].text()).toBe("third warning");
        expect(wrapper.findAllComponents("li")[3].text()).toBe("final warning");
      
        wrapper.setProps(mockPropsModelRun)
        expectTranslated(wrapper.findComponent("h5"), 
            "Model fit raised the following warning(s)", 
            "L'ajustement du modèle a soulevé le(s) avertissement(s) suivant(s)", 
            "O ajuste do modelo gerou o seguinte aviso (s)", 
        store)
        expect(wrapper.findComponent("h5").findComponent("alert-triangle-icon-stub").exists()).toBe(true);
        expect(wrapper.findAllComponents("li").length).toBe(1);
        expect(wrapper.findAllComponents("li")[0].text()).toBe("model run warning");

        wrapper.setProps(mockPropsModelCalibrate)
        expectTranslated(wrapper.findComponent("h5"), 
            "Model calibration raised the following warning(s)", 
            "L'étalonnage du modèle a déclenché le(s) avertissement(s) suivant(s)", 
            "A calibração do modelo gerou o (s) seguinte (s) aviso (s)", 
        store)
        expect(wrapper.findComponent("h5").findComponent("alert-triangle-icon-stub").exists()).toBe(true);
        expect(wrapper.findAllComponents("li").length).toBe(1);
        expect(wrapper.findAllComponents("li")[0].text()).toBe("calibrate warning");

        wrapper.setProps(mockPropsReviewInputs)
        expectTranslated(wrapper.findComponent("h5"),
            "Review inputs raised the following warning(s)",
            "L'examen des entrées a généré le ou le(s) avertissements suivant(s)",
            "As entradas de revisão geraram o (s) seguintes aviso (s)",
            store)
        expect(wrapper.findComponent("h5").findComponent("alert-triangle-icon-stub").exists()).toBe(true);
        expect(wrapper.findAllComponents("li").length).toBe(1);
        expect(wrapper.findAllComponents("li")[0].text()).toBe("review input warning");

        const hiddenWarning = wrapper.findComponent(".invisible")
        expect(hiddenWarning.findComponent("p").text()).toBe("Hidden line");
    });

    it("renders show more/less buttons if warnings are lengthy", async () => {
        const wrapper = createWrapper()
        setDivHeights(wrapper, 24, 96)
        wrapper.setProps(mockPropsModelRun)
        await Vue.nextTick()
        expectTranslated(wrapper.findComponent("button"), 
            "Show more", 
            "Montrer plus", 
            "Mostre mais", 
        store)
        await wrapper.findComponent("button").trigger("click")
        await Vue.nextTick();
        expectTranslated(wrapper.findComponent("button"),
            "Show less", 
            "Montrer moins", 
            "Mostre menos", 
        store)
    });

    it("does not show more/less buttons if warnings are not lengthy", async () => {
        const wrapper = createWrapper()
        setDivHeights(wrapper, 24, 24)
        wrapper.setProps(mockPropsModelRun)
        await Vue.nextTick()
        expect(wrapper.findComponent("button").exists()).toBe(false)
    });

    it("multiple warnings get truncated to one line each if lengthy", async () => {
        const wrapper = createWrapper(mockPropsModelRun)
        setDivHeights(wrapper, 24, 96)
        wrapper.setProps(mockPropsModelOptions)
        await Vue.nextTick()
        expect(wrapper.findAllComponents("li").length).toBe(4);
        expect(wrapper.findComponent("li > div").attributes("style")).toBe("height: 24px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;");
    });

    it("single warnings get truncated to multiple lines if lengthy", async () => {
        const wrapper = createWrapper()
        setDivHeights(wrapper, 24, 96)
        wrapper.setProps(mockPropsModelRun)
        await Vue.nextTick()
        expect(wrapper.findAllComponents("li").length).toBe(1);
        expect(wrapper.findComponent("li > div").attributes("style")).toBe("height: 48px; overflow: hidden; display: -webkit-box;");
    });

})
