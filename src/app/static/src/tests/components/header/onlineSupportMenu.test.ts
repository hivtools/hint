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
import DropDown from "../../../app/components/header/DropDown.vue";
import VueRouter from 'vue-router'


const localVue = createLocalVue()
localVue.use(VueRouter)
const router = new VueRouter()


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

    it("renders drop down with delay property true", () => {
        const store = createStore();
        const wrapper = shallowMount(OnlineSupportMenu, {
            store,
            localVue,
            router
        });

        const dropDown = wrapper.find(DropDown);
        expect(dropDown.props("delay")).toBe(true);
    });

    it("renders drop down text correctly", () => {
        const store = createStore();
        const wrapper = mount(OnlineSupportMenu, {
            store,
            localVue,
            router
        });
        wrapper.find(".dropdown-toggle").trigger("click");
        expect(wrapper.find(".dropdown-menu").classes())
            .toStrictEqual(["dropdown-menu", "show", "dropdown-menu-right"]);

        const link = wrapper.find(".dropdown").find("a");
        expectTranslated(link, "Online support", "Support en ligne",
            "Apoio online", store as any);
    });

    it("renders FAQ menu-item text", () => {
        const store = createStore();
        const wrapper = shallowMount(OnlineSupportMenu, {
            store,
            localVue,
            router
        });

        const link = wrapper.findAll(".dropdown-item").at(0);
        expectTranslated(link, "FAQ", "FAQ", "Perguntas Frequentes", store as any);
        expect(link.attributes("target")).toBe("_blank");
    });

    it("renders FAQ menu-item link href when language is English", () => {
        const store = createStore();
        const wrapper = shallowMount(OnlineSupportMenu, {
            store,
            localVue,
            router
        });

        const link = wrapper.findAll(".dropdown-item").at(0);
        expect(link.attributes("href")).toBe("https://mrc-ide.github.io/naomi-troubleshooting/index-en.html");
    });

    it("renders FAQ menu-item link href when lang is French", () => {
        const store = createStore();
        store.state.language = Language.fr;
        const wrapper = shallowMount(OnlineSupportMenu, {
            store,
            localVue,
            router
        });

        const link = wrapper.findAll(".dropdown-item").at(0);
        expect(link.attributes("href")).toBe("https://mrc-ide.github.io/naomi-troubleshooting/index-fr.html");
    });

    it("renders FAQ menu-item link href when language is Portuguese", () => {
        const store = createStore();
        store.state.language = Language.pt;
        const wrapper = shallowMount(OnlineSupportMenu, {
            store,
            localVue,
            router
        });

        const link = wrapper.findAll(".dropdown-item").at(0);
        // This will eventually link to Portuguese language FAQ doc, but using English doc for now
        expect(link.attributes("href")).toBe("https://mrc-ide.github.io/naomi-troubleshooting/index-en.html");
    });

    it("renders Contact menu-item text and link when modelBugReport switch is true", () => {
        switches.modelBugReport = true;

        const store = createStore();
        const wrapper = shallowMount(OnlineSupportMenu, {
            store,
            localVue,
            router
        });

        const link = wrapper.findAll(".dropdown-item").at(1);
        const expectedHref =
            "https://forms.office.com/Pages/ResponsePage.aspx?" +
                "id=B3WJK4zudUWDC0-CZ8PTB1APqcgcYz5DmSeKo5rlcfxUN0dWR1VMUEtHU0xDRU9HWFRNOFA5VVc3WCQlQCN0PWcu";

        expect(link.attributes("href")).toBe(expectedHref);
        expect(link.attributes("target")).toBe("_blank");
        expectTranslated(link, "Contact", "Contact", "Contacto",  store as any);

    });

    it("renders Contact menu item with old bug report href when modelBugReport switch is false", () => {
        switches.modelBugReport = false;

        const store = createStore();
        const wrapper = shallowMount(OnlineSupportMenu, {
            store,
            localVue,
            router
        });

        const link = wrapper.findAll(".dropdown-item").at(1);
        const expectedHref = "https://forms.gle/QxCT1b4ScLqKPg6a7";

        expect(link.attributes("href")).toBe(expectedHref);
        expect(link.attributes("target")).toBe("_blank");
        expectTranslated(link, "Contact", "Contact", "Contacto", store as any);
    });

    it("renders accessibility menu-item text and link", () => {
        const store = createStore();
        const wrapper = shallowMount(OnlineSupportMenu, {
            store,
            localVue,
            router
        });

        const link = wrapper.find("router-link-stub");
        expect(link.attributes("to")).toBe("/accessibility");
        expectTranslated(link, "Accessibility", "Accessibilité", "Acessibilidade", store as any);
    });
});
