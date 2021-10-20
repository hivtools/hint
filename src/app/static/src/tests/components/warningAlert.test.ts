import {shallowMount} from '@vue/test-utils';
import WarningAlert from "../../app/components/WarningAlert.vue";

describe("Warning alert component", () => {

    const warningsMock = {
        modelOptions: [{ text: 'a warning', locations: []}, { text: 'another warning', locations: []}, { text: 'third warning', locations: []}, { text: 'final warning', locations: []}],
        modelRun: [{ text: 'model run warning', locations: []}],
        modelCalibrate: [{ text: 'calibrate warning', locations: []}]
    }

    it("renders warning message", () => {
        const wrapper = shallowMount(WarningAlert, {
            propsData: {
                warnings: warningsMock
            }
        });

        // expect(wrapper.find(".alert-warning").text()).toBe("Error text");
        expect(wrapper.html()).toBe("Error text");
    });

})