import {createLocalVue, shallowMount} from '@vue/test-utils';
import Vue from 'vue';
import Vuex from 'vuex';
import Step from "../../app/components/Step.vue";

const localVue = createLocalVue();
Vue.use(Vuex);

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

    it("renders active step", () => {
        const wrapper = shallowMount(Step, {
            localVue,
            propsData: {
                active: true
            }
        });

        expect(wrapper.classes()).toStrictEqual(["col", "step", "no-padding", "active"]);
        expect(wrapper.find("button").classes()).toStrictEqual(["btn", "btn-red"]);
    });

    it("renders inactive step", () => {
        const wrapper = shallowMount(Step, {
            localVue,
            propsData: {
                active: false
            }
        });

        expect(wrapper.classes()).toStrictEqual(["col", "step", "no-padding"]);
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
        expect(wrapper.find("button").attributes().disabled).toBeUndefined();
        wrapper.find("button").trigger("click");
        Vue.nextTick();

        expect(wrapper.emitted().jump[0][0]).toBe(2);
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