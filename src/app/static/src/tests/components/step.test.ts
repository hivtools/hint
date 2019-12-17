import {createLocalVue, shallowMount} from '@vue/test-utils';
import Vuex from "vuex";
import Vue from 'vue';
import Step from "../../app/components/Step.vue";
import {emptyState} from "../../app/root";
import registerTranslations from "../../app/store/translations/registerTranslations";

const localVue = createLocalVue();

describe("Step component", () => {

    const store = new Vuex.Store({state: emptyState()});
    registerTranslations(store);

    it("renders step", () => {
        const wrapper = shallowMount(Step, {
            localVue,
            propsData: {
                textKey: "uploadBaseline"
            }
        });

        expect(wrapper.find("div").text()).toBe("Upload baseline data");
    });

    it("renders enabled step", () => {
        const wrapper = shallowMount(Step, {
            localVue,
            propsData: {
                textKey: "uploadBaseline",
                enabled: true
            }
        });

        expect(wrapper.classes()).toStrictEqual(["col", "step", "enabled"]);
    });

    it("renders active step", () => {
        const wrapper = shallowMount(Step, {
            localVue,
            propsData: {
                textKey: "uploadBaseline",
                active: true,
                enabled: true
            }
        });

        expect(wrapper.classes()).toStrictEqual(["col", "step", "active", "enabled"]);
        expect(wrapper.find("button").classes()).toStrictEqual(["btn", "btn-white"]);
    });

    it("renders inactive step", () => {
        const wrapper = shallowMount(Step, {
            localVue,
            propsData: {
                textKey: "uploadBaseline",
                active: false
            }
        });

        expect(wrapper.classes()).toStrictEqual(["col", "step"]);
        expect(wrapper.find("button").classes()).toStrictEqual(["btn"]);
    });

    it("renders enabled step", () => {
        const wrapper = shallowMount(Step, {
            localVue,
            propsData: {
                textKey: "uploadBaseline",
                enabled: true,
                number: 2
            }
        });

        expect(wrapper.classes()).toStrictEqual(["col", "step", "enabled"]);
        expect(wrapper.find("button").classes()).toStrictEqual(["btn", "btn-white"]);
        expect(wrapper.find("button").attributes().disabled).toBeUndefined();
        wrapper.find("button").trigger("click");
        Vue.nextTick();

        expect(wrapper.emitted().jump[0][0]).toBe(2);
    });

    it("renders complete step", () => {
        const wrapper = shallowMount(Step, {
            localVue,
            propsData: {
                textKey: "uploadBaseline",
                enabled: true,
                complete: true
            }
        });

        expect(wrapper.classes()).toStrictEqual(["col", "step", "complete", "enabled"]);
        expect(wrapper.find("button").classes()).toStrictEqual(["btn", "btn-red"]);
    });

    it("renders disabled step", () => {
        const wrapper = shallowMount(Step, {
            localVue,
            propsData: {
                textKey: "uploadBaseline",
                enabled: false
            }
        });
        expect(wrapper.find("button").attributes().disabled).toBeDefined();
        wrapper.find("button").trigger("click");

        Vue.nextTick();
        expect(wrapper.emitted().jump).toBeUndefined();
    });

});