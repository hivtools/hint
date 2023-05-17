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
        const wrapper = shallowMount(DropDown, {store, props: {text: "text"}});
        expect(wrapper.findComponent(".dropdown-menu").classes()).toStrictEqual(["dropdown-menu"]);
        wrapper.findComponent(".dropdown-toggle").trigger("click");
        expect(wrapper.findComponent(".dropdown-menu").classes()).toStrictEqual(["dropdown-menu", "show"]);
        wrapper.findComponent(".dropdown-toggle").trigger("click");
        expect(wrapper.findComponent(".dropdown-menu").classes()).toStrictEqual(["dropdown-menu"]);
    });

    it("closes dropdown on blur", () => {
        const wrapper = shallowMount(DropDown, {store, props: {text: "text", delay: false}});
        wrapper.findComponent(".dropdown-toggle").trigger("click");
        expect(wrapper.findComponent(".dropdown-menu").classes()).toStrictEqual(["dropdown-menu", "show"]);
        wrapper.findComponent(".dropdown-toggle").trigger("blur");
        expect(wrapper.findComponent(".dropdown-menu").classes()).toStrictEqual(["dropdown-menu"]);
    });

    it("closes dropdown on blur after delay when 'delay' prop is true", (done) => {
        const wrapper = shallowMount(DropDown, {store, props: {text: "text", delay: true}});
        wrapper.findComponent(".dropdown-toggle").trigger("click");
        expect(wrapper.findComponent(".dropdown-menu").classes()).toStrictEqual(["dropdown-menu", "show"]);
        wrapper.findComponent(".dropdown-toggle").trigger("blur");
        expect(wrapper.findComponent(".dropdown-menu").classes()).toStrictEqual(["dropdown-menu", "show"]);

        setTimeout(() => {
            expect(wrapper.findComponent(".dropdown-menu").classes()).toStrictEqual(["dropdown-menu"]);
            done();
        }, 1100);
    });
});
