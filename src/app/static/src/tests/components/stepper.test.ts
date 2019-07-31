import {createLocalVue, shallowMount} from '@vue/test-utils';
import Vue from 'vue';
import Vuex from 'vuex';
import {BaselineState} from "../../app/store/baseline/baseline";
import Stepper from "../../app/components/Stepper.vue";
import Step from "../../app/components/Step.vue";
import {mockBaselineState} from "../mocks";

const localVue = createLocalVue();
Vue.use(Vuex);

describe("Stepper component", () => {

    const createSut = (baselineState?: Partial<BaselineState>) => {

        return new Vuex.Store({
            modules: {
                baseline: {
                    namespaced: true,
                    state: mockBaselineState(baselineState)
                }
            }
        })
    };

    it("renders steps", () => {
        const store = createSut();
        const wrapper = shallowMount(Stepper, {store, localVue});
        const steps = wrapper.findAll(Step);

        expect(wrapper.findAll(Step).length).toBe(5);
        expect(steps.at(0).props().text).toBe("Upload baseline data");
        expect(steps.at(0).props().active).toBe(true);
        expect(steps.at(0).props().number).toBe(1);

        expect(steps.at(1).props().text).toBe("Upload survey and program data");
        expect(steps.at(1).props().active).toBe(false);
        expect(steps.at(1).props().number).toBe(2);

        expect(steps.at(2).props().text).toBe("Review uploads");
        expect(steps.at(2).props().active).toBe(false);
        expect(steps.at(2).props().number).toBe(3);

        expect(steps.at(3).props().text).toBe("Run model");
        expect(steps.at(3).props().active).toBe(false);
        expect(steps.at(3).props().number).toBe(4);

        expect(steps.at(4).props().text).toBe("Review output");
        expect(steps.at(4).props().active).toBe(false);
        expect(steps.at(4).props().number).toBe(5);
    });

    it("all steps except baseline are disabled initially", () => {
        const store = createSut();
        const wrapper = shallowMount(Stepper, {store, localVue});
        const steps = wrapper.findAll(Step);
        expect(steps.at(0).props().enabled).toBe(true);
        expect([1,2,3,4].filter(i => steps.at(i).props().enabled).length).toBe(0);
    });

    it("upload survey step is enabled when baseline step is complete", () => {
        const store = createSut({complete: true});
        const wrapper = shallowMount(Stepper, {store, localVue});
        const steps = wrapper.findAll(Step);
        expect(steps.at(0).props().enabled).toBe(true);
        expect(steps.at(1).props().enabled).toBe(true);
        expect([2,3,4].filter(i => steps.at(i).props().enabled).length).toBe(0);
    });

    it("updates active step when jump event is emitted", () => {
        const store = createSut({complete: true});
        const wrapper = shallowMount(Stepper, {store, localVue});
        const steps = wrapper.findAll(Step);
        steps.at(1).vm.$emit("jump", 2);
        expect(steps.at(1).props().active).toBe(true);
    });

});