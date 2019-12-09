import {createLocalVue, shallowMount} from '@vue/test-utils';
import Vue from 'vue';
import Vuex from 'vuex';
import Step from "../../app/components/Step.vue";

const localVue = createLocalVue();
;

describe("Step component", () => {

    it("renders step", () => {
        const wrapper = shallowMount(Step, {
            localVue,
            propsData: {
                text: "Test text"
            }
        });

        expect(wrapper.find("div").text()).toBe("Test text");
    });

    it("renders enabled step", () => {
        const wrapper = shallowMount(Step, {
            localVue,
            propsData: {
                enabled: true
            }
        });

        expect(wrapper.classes()).toStrictEqual(["col", "step", "enabled"]);
    });

    it("renders active step", () => {
        const wrapper = shallowMount(Step, {
            localVue,
            propsData: {
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
                enabled: false
            }
        });
        expect(wrapper.find("button").attributes().disabled).toBeDefined();
        wrapper.find("button").trigger("click");

        Vue.nextTick();
        expect(wrapper.emitted().jump).toBeUndefined();
    });

});