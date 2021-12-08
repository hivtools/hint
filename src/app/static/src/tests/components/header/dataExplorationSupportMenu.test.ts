import {createLocalVue, mount, shallowMount} from "@vue/test-utils";
import Vuex from "vuex";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {expectTranslated} from "../../testHelpers";
import DropDown from "../../../app/components/header/DropDown.vue";
import VueRouter from 'vue-router'
import DataExplorationSupportMenu from "../../../app/components/header/DataExplorationSupportMenu.vue"
import {mockDataExplorationState} from "../../mocks";

const localVue = createLocalVue()
localVue.use(VueRouter)
const router = new VueRouter()

describe("Data exploration online support menu", () => {
    const createStore = () => {
        const store = new Vuex.Store({
            state: mockDataExplorationState(),
        });
        registerTranslations(store);
        return store;
    };

    it("renders drop down with delay property true", () => {
        const store = createStore();
        const wrapper = shallowMount(DataExplorationSupportMenu, {
            store,
            localVue,
            router
        });

        const dropDown = wrapper.find(DropDown);
        expect(dropDown.props("delay")).toBe(true);
    });

    it("renders drop down text correctly", () => {
        const store = createStore();
        const wrapper = mount(DataExplorationSupportMenu, {
            store,
            localVue,
            router
        });
        wrapper.find(".dropdown-toggle").trigger("click");
        expect(wrapper.find(".dropdown-menu").classes())
            .toStrictEqual(["dropdown-menu", "show", "dropdown-menu-right"]);

        const link = wrapper.find(".dropdown").findAll("a");

        expect(link.length).toBe(3)

        expectTranslated(link.at(0),
            "Online support",
            "Support en ligne",
            "Apoio online",
            store as any);

        expectTranslated(link.at(1),
            "Report issues",
            "Signaler des problèmes",
            "Reportar problemas",
            store as any);

        expectTranslated(link.at(2),
            "Accessibility",
            "Accessibilité",
            "Acessibilidade",
            store as any);
    });

    it("renders accessibility menu-item text and link", () => {
        const store = createStore();
        const wrapper = shallowMount(DataExplorationSupportMenu, {
            store,
            localVue,
            router
        });

        const link = wrapper.find("router-link-stub");
        expect(link.attributes("to")).toBe("/accessibility");
    });

});