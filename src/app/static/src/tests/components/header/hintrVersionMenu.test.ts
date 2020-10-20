import { createLocalVue, mount, shallowMount } from "@vue/test-utils";
import Vuex from "vuex";

import HintrVersionMenu from "../../../app/components/header/HintrVersionMenu.vue";
import DropDown from "../../../app/components/header/DropDown.vue";
import { mockHintrVersionState, mockRootState } from "../../mocks";
import { emptyState, RootState } from "../../../app/root";
import { hintrGetters, hintrVersion, initialHintrVersionState } from "../../../app/store/hintrVersion/hintrVersion";


describe("Hintr Version", () => {

    const mockGetHinrVersion = jest.fn();

    const createStore = () => {
        const store = new Vuex.Store({
            state: emptyState(),
            modules: {
                hintrVersion: {
                    namespaced: true,
                    state: mockHintrVersionState(),
                    actions: {
                        getHintrVersion: mockGetHinrVersion
                    }
                }
            }
        });
        return store;
    }

    it("hintr version menu gets initial version placeholder ", () => {
        const store = createStore();
        const wrapper = shallowMount(HintrVersionMenu, {
            store
        });

        expect(wrapper.findAll("a").length).toBe(4);

        //v naomi is a default value for the props
        expect(wrapper.find(DropDown).props("text")).toBe("vnaomi");
    });

    it("expect get method to have been called", () => {
        const store = createStore();
        const wrapper = shallowMount(HintrVersionMenu, {
            store: store,
            methods: {
                getHintrVersion: mockGetHinrVersion
            }
        });

        expect(mockGetHinrVersion).toHaveBeenCalled()

    });

})