import {createLocalVue, mount, shallowMount} from "@vue/test-utils";
import Vuex from "vuex";
import OnlineSupportMenu from "../../../app/components/header/OnlineSupportMenu.vue";
import {emptyState} from "../../../app/root";
import {actions} from "../../../app/store/root/actions";
import {mutations} from "../../../app/store/root/mutations";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {Language} from "../../../app/store/translations/locales";
import {expectTranslated} from "../../testHelpers";
import DropDown from "../../../app/components/header/DropDown.vue";
import VueRouter from 'vue-router'
import ErrorReport from "../../../app/components/ErrorReport.vue";
import {mockProjectsState, mockStepperState} from "../../mocks";

const localVue = createLocalVue()
localVue.use(VueRouter)
const router = new VueRouter()


describe("Online support menu", () => {
    const createStore = () => {
        const store = new Vuex.Store({
            state: emptyState(),
            actions: actions,
            mutations: mutations,
            modules: {
                stepper: {
                    namespaced: true,
                    state: mockStepperState()
                },
                projects: {
                    namespaced: true,
                    state: mockProjectsState()
                }
            },
            getters: {
                isGuest: () => false
            }
        });
        registerTranslations(store);
        return store;
    };

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

    it("renders error report widget", () => {

        const store = createStore();
        const wrapper = shallowMount(OnlineSupportMenu, {
            store,
            localVue,
            router
        });

        expect(wrapper.findAll(ErrorReport).length).toBe(1);
        expect(wrapper.find(ErrorReport).props("open")).toBe(false);

        const link = wrapper.findAll(".dropdown-item").at(1);
        expectTranslated(link, "Report issues", "Signaler des problèmes", "Reportar problemas", store as any);

        link.trigger("click");

        expect(wrapper.find(ErrorReport).props("open")).toBe(true);
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
