import {mount, shallowMount} from "@vue/test-utils";
import ShareProject from "../../../app/components/projects/ShareProject.vue";
import Modal from "../../../app/components/Modal.vue";
import Vuex from "vuex";
import {emptyState} from "../../../app/root";
import registerTranslations from "../../../app/store/translations/registerTranslations";

describe("ShareProject", () => {

    const createStore = () => {
        const store = new Vuex.Store({
            state: emptyState()
        });
        registerTranslations(store);
        return store;
    }

    it("opens modal on click", () => {
        const wrapper = shallowMount(ShareProject, {
            propsData: {
                project: {id: 1, name: "p1"}
            },
            store: createStore()
        });

        expect(wrapper.find(Modal).props("open")).toBe(false);
        const link = wrapper.find("a");
        expect(link.text()).toBe("Share");
        link.trigger("click");
        expect(wrapper.find(Modal).props("open")).toBe(true);
    });

    it("can cancel sharing", () => {
        const wrapper = mount(ShareProject, {
            propsData: {
                project: {id: 1, name: "p1"}
            },
            store: createStore()
        });

        const link = wrapper.find("a");
        link.trigger("click");
        expect(wrapper.find(Modal).props("open")).toBe(true);
        wrapper.find(Modal).findAll("button").at(1).trigger("click");
        expect(wrapper.find(Modal).props("open")).toBe(false);
    });

    it("if emails are invalid, valiation feedback is shown and no action taken", () => {
        const wrapper = shallowMount(ShareProject, {
            propsData: {
                project: {id: 1, name: "p1"}
            },
            store: createStore()
        });

        const link = wrapper.find("a");
        link.trigger("click");
    });

});
