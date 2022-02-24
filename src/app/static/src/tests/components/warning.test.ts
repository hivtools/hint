import {createLocalVue, shallowMount, Wrapper} from '@vue/test-utils';
import Warning from "../../app/components/Warning.vue";
import Vue from "vue";
import Vuex from "vuex";
import {emptyState} from "../../app/root";
import registerTranslations from "../../app/store/translations/registerTranslations";
import {expectTranslated} from "../testHelpers";

const localVue = createLocalVue();

describe("Warning component", () => {

    const mockPropsModelOptions = {
        origin: "modelOptions",
        warnings: [{ text: 'a warning', locations: []}, { text: 'another warning', locations: []}, { text: 'third warning', locations: []}, { text: 'final warning', locations: []}]
    }

    const mockPropsModelRun = {
        origin: "modelRun",
        warnings: [{ text: 'model run warning', locations: []}]
    }

    const mockPropsModelCalibrate = {
        origin: "modelCalibrate",
        warnings: [{ text: 'calibrate warning', locations: []}]
    }

    const store = new Vuex.Store({state: emptyState()});
    registerTranslations(store);

    const createWrapper = (propsData = mockPropsModelOptions) => {
        const wrapper = shallowMount(Warning, {
            propsData,
            store,
            localVue
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
        expect(wrapper.find("div").exists()).toBe(false);
    });

    it("renders warning messages", () => {
        const wrapper = createWrapper()
        expectTranslated(wrapper.find("h5"), 
            "Model option validation raised the following warning(s)", 
            "La validation de l'option de modèle a généré le(s) avertissement(s) suivant(s)", 
            "A validação da opção de modelo gerou o (s) seguinte (s) aviso (s)", 
        store)
        expect(wrapper.find("h5").find("alert-triangle-icon-stub").exists()).toBe(true);
        expect(wrapper.findAll("li").length).toBe(4);
        expect(wrapper.find("li > div").attributes("style")).toBeUndefined();
        expect(wrapper.findAll("li").at(0).text()).toBe("a warning");
        expect(wrapper.findAll("li").at(1).text()).toBe("another warning");
        expect(wrapper.findAll("li").at(2).text()).toBe("third warning");
        expect(wrapper.findAll("li").at(3).text()).toBe("final warning");
      
        wrapper.setProps(mockPropsModelRun)
        expectTranslated(wrapper.find("h5"), 
            "Model fit raised the following warning(s)", 
            "L'ajustement du modèle a soulevé le(s) avertissement(s) suivant(s)", 
            "O ajuste do modelo gerou o seguinte aviso (s)", 
        store)
        expect(wrapper.find("h5").find("alert-triangle-icon-stub").exists()).toBe(true);
        expect(wrapper.findAll("li").length).toBe(1);
        expect(wrapper.findAll("li").at(0).text()).toBe("model run warning");

        wrapper.setProps(mockPropsModelCalibrate)
        expectTranslated(wrapper.find("h5"), 
            "Model calibration raised the following warning(s)", 
            "L'étalonnage du modèle a déclenché le(s) avertissement(s) suivant(s)", 
            "A calibração do modelo gerou o (s) seguinte (s) aviso (s)", 
        store)
        expect(wrapper.find("h5").find("alert-triangle-icon-stub").exists()).toBe(true);
        expect(wrapper.findAll("li").length).toBe(1);
        expect(wrapper.findAll("li").at(0).text()).toBe("calibrate warning");

        const hiddenWarning = wrapper.find(".invisible")
        expect(hiddenWarning.find("p").text()).toBe("Hidden line");
    });

    it("renders show more/less buttons if warnings are lengthy", async () => {
        const wrapper = createWrapper()
        setDivHeights(wrapper, 24, 96)
        wrapper.setProps(mockPropsModelRun)
        await Vue.nextTick()
        expectTranslated(wrapper.find("button"), 
            "Show more", 
            "Montrer plus", 
            "Mostre mais", 
        store)
        await wrapper.find("button").trigger("click")
        expectTranslated(wrapper.find("button"), 
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
        expect(wrapper.find("button").exists()).toBe(false)
    });

    it("multiple warnings get truncated to one line each if lengthy", async () => {
        const wrapper = createWrapper(mockPropsModelRun)
        setDivHeights(wrapper, 24, 96)
        wrapper.setProps(mockPropsModelOptions)
        await Vue.nextTick()
        expect(wrapper.findAll("li").length).toBe(4);
        expect(wrapper.find("li > div").attributes("style")).toBe("height: 24px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;");
    });

    it("single warnings get truncated to multiple lines if lengthy", async () => {
        const wrapper = createWrapper()
        setDivHeights(wrapper, 24, 96)
        wrapper.setProps(mockPropsModelRun)
        await Vue.nextTick()
        expect(wrapper.findAll("li").length).toBe(1);
        expect(wrapper.find("li > div").attributes("style")).toBe("height: 48px; overflow: hidden; display: -webkit-box;");
    });

})