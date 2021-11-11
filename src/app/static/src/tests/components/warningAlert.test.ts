import {createLocalVue, shallowMount} from '@vue/test-utils';
import WarningAlert from "../../app/components/WarningAlert.vue";
import Warning from "../../app/components/Warning.vue";
import Vuex from "vuex";
import {emptyState} from "../../app/root";
import registerTranslations from "../../app/store/translations/registerTranslations";

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

    it("renders no warning alert if there are no warnings", () => {
        const wrapper = createWrapper({ modelOptions: [], modelRun: [], modelCalibrate: []})
        expect(wrapper.find(".alert-warning").exists()).toBe(false);
    });

    it("renders warning messages", () => {
        const wrapper = createWrapper()

        expect(wrapper.find(".alert-warning").exists()).toBe(true);
        const warnings = wrapper.findAll(Warning)
        expect(warnings.length).toBe(3);
        expect(warnings.at(0).props()).toStrictEqual({maxLines: 2, origin: "modelOptions", warnings: warningsMock["modelOptions"]});
        expect(warnings.at(1).props()).toStrictEqual({maxLines: 2, origin: "modelRun", warnings: warningsMock["modelRun"]});
        expect(warnings.at(2).props()).toStrictEqual({maxLines: 2, origin: "modelCalibrate", warnings: warningsMock["modelCalibrate"]});
    });

    it("only renders warning messages that have warnings and sets maxLines prop", () => {
        const wrapper = createWrapper({
            modelOptions: [],
            modelRun: [{ text: 'model run warning', locations: []}],
            modelCalibrate: []
        })
        wrapper.setProps({maxLines: 3})

        expect(wrapper.find(".alert-warning").exists()).toBe(true);
        const warnings = wrapper.findAll(Warning)
        expect(warnings.length).toBe(1);
        expect(warnings.at(0).props()).toStrictEqual({maxLines: 3, origin: "modelRun", warnings: warningsMock["modelRun"]});
    });

})