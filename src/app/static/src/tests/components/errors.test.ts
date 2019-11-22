import {createLocalVue, shallowMount} from "@vue/test-utils";
import Vue from "vue";
import Vuex from "vuex";
import {mutations} from "../../app/store/errors/mutations";
import Errors from "../../app/components/Errors.vue";

const localVue = createLocalVue();
Vue.use(Vuex);

describe("Errors component", () => {

    const createStore = (errors: string[]) => {
        return new Vuex.Store({
            modules: {
                errors: {
                    namespaced: true,
                    state: {errors},
                    mutations
                }
            }
        })
    };

    const propsData = {title: "TestApp"};

    it ("renders as expected", () => {
        const store = createStore(["First error", "Second error"]);
        const wrapper = shallowMount(Errors, {propsData, store, localVue});

        const paras = wrapper.findAll("p");
        expect(paras.length).toBe(3);
        expect(paras.at(0).text()).toBe("The following errors occurred. Please contact TestApp support if this problem persists.");
        expect(paras.at(1).text()).toBe("First error");
        expect(paras.at(2).text()).toBe("Second error");
    });

    it ("renders nothing when no errors", () => {
        const store = createStore([]);
        const wrapper = shallowMount(Errors, {propsData, store, localVue});
        expect(wrapper.html()).toBeFalsy();
    });

    it ("commits dismissAll mutation when close button pressed", () => {
        const store = createStore(["First error"]);
        const wrapper = shallowMount(Errors, {propsData, store, localVue});
        const closeButton = wrapper.find("button");
        closeButton.trigger("click");

        expect(wrapper.html()).toBeFalsy();
    });
});