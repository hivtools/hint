import {createLocalVue, shallowMount} from '@vue/test-utils';
import WarningAlert from "../../app/components/WarningAlert.vue";
import Warning from "../../app/components/Warning.vue";
import Vuex from "vuex";
import {emptyState} from "../../app/root";
import registerTranslations from "../../app/store/translations/registerTranslations";
import {ModelOptionsMutation} from "../../app/store/modelOptions/mutations";
import {ModelCalibrateMutation} from "../../app/store/modelCalibrate/mutations";
import {ModelRunMutation} from "../../app/store/modelRun/mutations";

const localVue = createLocalVue();

describe("Warning alert component", () => {

    const warningsMock = {
        modelOptions: [{ text: 'a warning', locations: []}, { text: 'another warning', locations: []}, { text: 'third warning', locations: []}, { text: 'final warning', locations: []}],
        modelRun: [{ text: 'model run warning', locations: []}],
        modelCalibrate: [{ text: 'calibrate warning', locations: []}]
    }

    const clearOptionsWarnings = jest.fn(); 
    const clearCalibrateWarnings = jest.fn(); 
    const clearRunWarnings = jest.fn(); 

    const store = new Vuex.Store({
        state: emptyState(),
        modules: {
            modelOptions: {
                namespaced: true,
                mutations: {
                    [ModelOptionsMutation.ClearWarnings]: clearOptionsWarnings
                }
            },
            modelCalibrate: {
                namespaced: true,
                mutations: {
                    [ModelCalibrateMutation.ClearWarnings]: clearCalibrateWarnings
                }
            },
            modelRun: {
                namespaced: true,
                mutations: {
                    [ModelRunMutation.ClearWarnings]: clearRunWarnings
                }
            },
        }
    });
    registerTranslations(store);

    const createWrapper = (warnings = warningsMock, activeStep = 3) => {
        const wrapper = shallowMount(WarningAlert, {
            propsData: {
                warnings: warnings,
                activeStep
            },
            store,
            localVue
        });
        return wrapper
    }

    afterEach(() => {
        jest.resetAllMocks();
    });

    it("renders no warning alert if there are no warnings", () => {
        const wrapper = createWrapper({ modelOptions: [], modelRun: [], modelCalibrate: []})
        expect(wrapper.find(".alert-warning").exists()).toBe(false);
    });

    it("renders warning messages", async () => {
        const wrapper = createWrapper()

        expect(wrapper.find(".alert-warning").exists()).toBe(true);
        const warnings = wrapper.findAll(Warning)
        expect(warnings.length).toBe(3);
        expect(warnings.at(0).props()).toStrictEqual({maxLines: 2, origin: "modelOptions", warnings: warningsMock["modelOptions"]});
        expect(warnings.at(1).props()).toStrictEqual({maxLines: 2, origin: "modelRun", warnings: warningsMock["modelRun"]});
        expect(warnings.at(2).props()).toStrictEqual({maxLines: 2, origin: "modelCalibrate", warnings: warningsMock["modelCalibrate"]});
    });

    it("clicking close when in modelOptions triggers clear warnings mutation in modelOptions store", async () => {
        const wrapper = createWrapper()
        await wrapper.find("button").trigger("click")
        expect(clearOptionsWarnings.mock.calls.length).toBe(1);
    });

    it("clicking close when in modelRun triggers clear warnings mutation in modelRun store", async () => {
        const wrapper = createWrapper(warningsMock, 4)
        await wrapper.find("button").trigger("click")
        expect(clearRunWarnings.mock.calls.length).toBe(1);
    });

    it("clicking close when in modelCalibrate triggers clear warnings mutation in modelCalibrate store", async () => {
        const wrapper = createWrapper(warningsMock, 5)
        await wrapper.find("button").trigger("click")
        expect(clearCalibrateWarnings.mock.calls.length).toBe(1);
    });

    it("clicking close when in reviewOutput triggers clear warnings mutation in modelCalibrate store", async () => {
        const wrapper = createWrapper(warningsMock, 6)
        await wrapper.find("button").trigger("click")
        expect(clearCalibrateWarnings.mock.calls.length).toBe(1);
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