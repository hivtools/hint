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

    const oldModelBugReportValue = switches.modelBugReport;
    afterEach(() => {
        switches.modelBugReport = oldModelBugReportValue;
    });

    it("renders drop down text correctly", () => {
        const store = createStore();
        const wrapper = mount(OnlineSupportMenu, {
            store
        });
        wrapper.find(".dropdown-toggle").trigger("click");
        expect(wrapper.find(".dropdown-menu").classes())
            .toStrictEqual(["dropdown-menu", "show", "dropdown-menu-right"]);

        const link = wrapper.find(".dropdown").find("a");
        expectTranslated(link, "Online support", "Support en ligne", store as any);
    });

    it("renders FAQ menu-item text and link when language is English", () => {
        const store = createStore();
        const wrapper = shallowMount(OnlineSupportMenu, {
            store
        });

        const link = wrapper.findAll(".dropdown-item").at(0);
        expect(link.attributes("href")).toBe("https://mrc-ide.github.io/naomi-troubleshooting/index-en.html");
        expect(link.attributes("target")).toBe("_blank");
        expectTranslated(link, "FAQ", "FAQ", store as any);
    });

    it("renders FAQ menu-item text and link when lang is French", () => {
        const store = createStore();
        store.state.language = Language.fr;
        const wrapper = shallowMount(OnlineSupportMenu, {
            store
        });

        const link = wrapper.findAll(".dropdown-item").at(0);
        expect(link.attributes("href")).toBe("https://mrc-ide.github.io/naomi-troubleshooting/index-fr.html");
        expect(link.attributes("target")).toBe("_blank");
        expectTranslated(link, "FAQ", "FAQ", store as any);
    });

    it("renders Contact menu-item text and link when modelBugReport switch is true", () => {
        switches.modelBugReport = true;

        const store = createStore();
        const wrapper = shallowMount(OnlineSupportMenu, {
            store
        });

        const link = wrapper.findAll(".dropdown-item").at(1);
        const expectedHref =
            "https://forms.office.com/Pages/ResponsePage.aspx?" +
                "id=B3WJK4zudUWDC0-CZ8PTB1APqcgcYz5DmSeKo5rlcfxUN0dWR1VMUEtHU0xDRU9HWFRNOFA5VVc3WCQlQCN0PWcu";

        expect(link.attributes("href")).toBe(expectedHref);
        expect(link.attributes("target")).toBe("_blank");
        expectTranslated(link, "Contact", "Contact", store as any);

    });

    it("renders Contact menu item with old bug report href when modelBugReport switch is false", () => {
        switches.modelBugReport = false;

        const store = createStore();
        const wrapper = shallowMount(OnlineSupportMenu, {
            store
        });

        const link = wrapper.findAll(".dropdown-item").at(1);
        const expectedHref = "https://forms.gle/QxCT1b4ScLqKPg6a7";

        expect(link.attributes("href")).toBe(expectedHref);
        expect(link.attributes("target")).toBe("_blank");
        expectTranslated(link, "Contact", "Contact", store as any);
    });
});
