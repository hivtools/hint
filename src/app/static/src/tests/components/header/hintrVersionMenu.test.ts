import {shallowMount } from "@vue/test-utils";
import Vuex from "vuex";
import {expectTranslated} from "../../testHelpers";
import HintrVersionMenu from "../../../app/components/header/HintrVersionMenu.vue";
import DropDown from "../../../app/components/header/DropDown.vue";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import { mockHintrVersionState } from "../../mocks";
import { emptyState } from "../../../app/root";
import {currentHintVersion} from "../../../app/hintVersion";

describe("Hintr Menu Version", () => {

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
        registerTranslations(store);
        return store;
    }

    it("hintr version menu displays span for (5) items", async() => {
        const store = createStore();
        const wrapper = shallowMount(HintrVersionMenu, {
            store
        });

        expect(wrapper.findAll("span").length).toBe(5);
    });

    it("hintr version menu displays link to news site", async() => {
        const store = createStore();
        const wrapper = shallowMount(HintrVersionMenu, {
            store
        });

        const links = wrapper.findAll("a");
        expect(links.length).toBe(1);
        const link = links.at(0);
        expectTranslated(link, "News", "Nouvelles", "Notícias", store);
        expect(link.attributes("href")).toBe("https://naomi.unaids.org/news");
        expect(link.attributes("target")).toBe("_blank");
    });

    it("hintr version menu displays current hint version", async() => {
        const store = createStore();
        const wrapper = shallowMount(HintrVersionMenu, {
            store
        });

        expect(wrapper.findAll("span").at(4).text()).toBe(`hint : v${currentHintVersion}`);
    });

    it("hintr version menu gets initial version placeholder before getter ", async() => {
        const store = createStore();
        const wrapper = shallowMount(HintrVersionMenu, {
            store
        });

        expect(wrapper.find(DropDown).props("text")).toBe("vunknown");
    });

    it("expect get method to have been called", () => {
        expect(mockGetHinrVersion).toHaveBeenCalled()
    });
})
