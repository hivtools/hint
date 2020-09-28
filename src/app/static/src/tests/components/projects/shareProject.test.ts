import {mount, shallowMount} from "@vue/test-utils";
import ShareProject from "../../../app/components/projects/ShareProject.vue";
import Modal from "../../../app/components/Modal.vue";
import Vuex from "vuex";
import {emptyState} from "../../../app/root";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import LoadingSpinner from "../../../app/components/LoadingSpinner.vue";

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

    it("if emails are invalid, validation feedback is shown and no action taken", () => {
        const wrapper = mount(ShareProject, {
            propsData: {
                project: {id: 1, name: "p1"}
            },
            store: createStore()
        });

        const link = wrapper.find("a");
        link.trigger("click");
        wrapper.find(Modal).find("input").setValue("bademail");
        wrapper.find(Modal).findAll("button").at(0).trigger("click");
        expect(wrapper.find(Modal).props("open")).toBe(true);
        expect(wrapper.find(Modal).findAll(LoadingSpinner).length).toBe(0);
        expect(wrapper.find(Modal).find("input").classes()).toContain("is-invalid");
    });

    it("if emails are valid, project is shared", (done) => {
        const wrapper = mount(ShareProject, {
            propsData: {
                project: {id: 1, name: "p1"}
            },
            store: createStore()
        });

        const link = wrapper.find("a");
        link.trigger("click");
        wrapper.find(Modal).find("input").setValue("goodemail@gmail.com");
        wrapper.find(Modal).findAll("button").at(0).trigger("click");
        expect(wrapper.find(Modal).props("open")).toBe(true);
        expect(wrapper.find(Modal).findAll(LoadingSpinner).length).toBe(1);

        setTimeout(() => {
            expect(wrapper.find(Modal).props("open")).toBe(false);
            expect(wrapper.find(Modal).findAll(LoadingSpinner).length).toBe(0);
            done();
        }, 200)
    });

});
