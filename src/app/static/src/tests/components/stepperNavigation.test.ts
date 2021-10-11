import {shallowMount} from "@vue/test-utils";
import StepperNavigation from "../../app/components/StepperNavigation.vue";
import registerTranslations from "../../app/store/translations/registerTranslations";
import Vuex from "vuex";
import {mockRootState} from "../mocks";

describe("Stepper navigation component", () => {

    beforeEach(() => registerTranslations(new Vuex.Store({state: mockRootState()})));

    it("enables links and invokes callbacks", () => {
        const back = jest.fn();
        const next = jest.fn();
        const wrapper = shallowMount(StepperNavigation, {
            propsData: {
                backDisabled: false, back,
                nextDisabled: false, next
            }
        });

        const backLink = wrapper.find("#back");
        expect(backLink.classes("disabled")).toBe(false);
        backLink.trigger("click");
        expect(back.mock.calls.length).toBe(1);

        const continueLink = wrapper.find("#continue");
        expect(continueLink.classes("disabled")).toBe(false);
        continueLink.trigger("click");
        expect(next.mock.calls.length).toBe(1);
    });

    it("disables links", () => {
        const back = jest.fn();
        const next = jest.fn();
        const wrapper = shallowMount(StepperNavigation, {
            propsData: {
                backDisabled: true, back,
                nextDisabled: true, next
            }
        });

        const backLink = wrapper.find("#back");
        expect(backLink.classes("disabled")).toBe(true);
        backLink.trigger("click");
        expect(back.mock.calls.length).toBe(0);

        const continueLink = wrapper.find("#continue");
        expect(continueLink.classes("disabled")).toBe(true);
        continueLink.trigger("click");
        expect(next.mock.calls.length).toBe(0);
    });

});
