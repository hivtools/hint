import {shallowMount} from "@vue/test-utils";
import DropDown from "../../../app/components/header/DropDown.vue";
import Vuex from "vuex";
import {emptyState} from "../../../app/root";
import registerTranslations from "../../../app/store/translations/registerTranslations";

describe("Drop down", () => {
    const store = new Vuex.Store({
        state: emptyState()
    });
    registerTranslations(store);

    it("toggles dropdown on click", () => {
        const wrapper = shallowMount(DropDown, {store, propsData: {text: "text"}});
        expect(wrapper.find(".dropdown-menu").classes()).toStrictEqual(["dropdown-menu"]);
        wrapper.find(".dropdown-toggle").trigger("click");
        expect(wrapper.find(".dropdown-menu").classes()).toStrictEqual(["dropdown-menu", "show"]);
        wrapper.find(".dropdown-toggle").trigger("click");
        expect(wrapper.find(".dropdown-menu").classes()).toStrictEqual(["dropdown-menu"]);
    });

    it("closes dropdown on blur", () => {
        const wrapper = shallowMount(DropDown, {store, propsData: {text: "text"}});
        wrapper.find(".dropdown-toggle").trigger("click");
        expect(wrapper.find(".dropdown-menu").classes()).toStrictEqual(["dropdown-menu", "show"]);
        wrapper.find(".dropdown-toggle").trigger("blur");
        expect(wrapper.find(".dropdown-menu").classes()).toStrictEqual(["dropdown-menu"]);
    });
});
