import {createLocalVue, mount, shallowMount} from "@vue/test-utils";
import Vuex from "vuex";
import OnlineSupportMenu from "../../../app/components/header/OnlineSupportMenu.vue";
import {emptyState} from "../../../app/root";
import {actions} from "../../../app/store/root/actions";
import {mutations} from "../../../app/store/root/mutations";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {switches} from "../../../app/featureSwitches";
import {Language} from "../../../app/store/translations/locales";
import {expectTranslated} from "../../testHelpers";

describe("Online support menu", () => {

    const createStore = () => {
        const store = new Vuex.Store({
            state: emptyState(),
            actions: actions,
            mutations: mutations
        });
        registerTranslations(store);
        return store;
    };

    it("renders drop down text correctly", async () => {
        const store = createStore();
        const wrapper = mount(OnlineSupportMenu, {
            store
        });
        wrapper.find(".dropdown-toggle").trigger("click");
        expect(wrapper.find(".dropdown-menu").classes())
            .toStrictEqual(["dropdown-menu", "show", "dropdown-menu-right"]);

        const link = wrapper.find(".dropdown").find("a")
        expectTranslated(link, "Online support", "Support en ligne", store as any);
    });

    it("renders FAQ menu-item text and links work when lang is English", async () => {
        const store = createStore();
        const wrapper = shallowMount(OnlineSupportMenu, {
            store
        });
        window.open = jest.fn();

        const link = wrapper.findAll(".dropdown-item").at(0);
        link.trigger("mousedown");
        expect(window.open).toHaveBeenCalledTimes(1)
        expect(window.open)
            .toHaveBeenCalledWith("https://mrc-ide.github.io/naomi-troubleshooting/index-en.html",
                "_blank")
        expectTranslated(link, "FAQ", "FAQ", store as any);

    });

    it("renders contact menu-item text and links work when lang is English", async () => {
        const store = createStore();
        const wrapper = shallowMount(OnlineSupportMenu, {
            store
        });
        window.open = jest.fn();

        const link = wrapper.findAll(".dropdown-item").at(1);
        link.trigger("mousedown");
        if (switches.modelBugReport) {
            expect(window.open).toHaveBeenCalledTimes(1)
            expect(window.open)
                .toHaveBeenCalledWith("https://forms.office.com/Pages/ResponsePage.aspx?" +
                    "id=B3WJK4zudUWDC0-CZ8PTB1APqcgcYz5DmSeKo5rlcfxUN0dWR1VMUEtHU0xDRU9HWFRNOFA5VVc3WCQlQCN0PWcu",
                    "_blank")
            expectTranslated(link, "Contact", "Contact", store as any);
        }
    });

    it("renders menu-items text and links work when lang is French", async () => {
        const store = createStore();
        store.state.language = Language.fr
        const wrapper = shallowMount(OnlineSupportMenu, {
            store
        });
        window.open = jest.fn();

        const link = wrapper.findAll(".dropdown-item").at(0);
        link.trigger("mousedown");
        expect(window.open).toHaveBeenCalledTimes(1)
        expect(window.open)
            .toHaveBeenCalledWith("https://mrc-ide.github.io/naomi-troubleshooting/index-fr.html", "_blank")
        expectTranslated(link, "FAQ", "FAQ", store as any);
    });

    it("renders old modelBugReport path when switch is set off", async () => {
        const store = createStore();
        const wrapper = shallowMount(OnlineSupportMenu, {
            store
        });
        window.open = jest.fn();

        const link = wrapper.findAll(".dropdown-item").at(1);
        link.trigger("mousedown");
        if (!switches.modelBugReport) {
            expect(window.open).toHaveBeenCalledTimes(1)
            expect(window.open)
                .toHaveBeenCalledWith(" https://forms.gle/QxCT1b4ScLqKPg6a7", "_blank")
            expectTranslated(link, "Contact", "Contact", store as any);
        }
    });

})
