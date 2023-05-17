import {shallowMount} from "@vue/test-utils";
import Modal from "../../app/components/Modal.vue";

describe("modal", () => {

    it("is displayed when open is true", () => {

        const wrapper = shallowMount(Modal, {
            props: {
                open: true
            }
        });
        expect((wrapper.findComponent(".modal").element as HTMLElement).style.display).toBe("block");
        expect(wrapper.findAllComponents(".modal-backdrop").length).toBe(1);
    });

    it("is not displayed when open is false", () => {

        const wrapper = shallowMount(Modal, {
            props: {
                open: false
            }
        });

        expect((wrapper.findComponent(".modal").element as HTMLElement).style.display).toBe("none");
        expect(wrapper.findAllComponents(".modal-backdrop").length).toBe(0);
    });

    it("displays child content in body", () => {

        const wrapper = shallowMount(Modal, {
            props: {
                open: true
            },
            slots: {
                default: "TEST"
            }
        });

        expect(wrapper.findComponent(".modal-body").text()).toBe("TEST");
    });

    it("does not include footer if footer slot is missing", () => {
        const wrapper = shallowMount(Modal, {
            props: {
                open: true
            },
            slots: {
                default: "TEST"
            }
        });

        expect(wrapper.findAllComponents(".modal-footer").length).toBe(0);
    });

    it("includes footer slot if provided", () => {
        const wrapper = shallowMount(Modal, {
            props: {
                open: true
            },
            slots: {
                default: "TEST",
                footer: "test-footer"
            }
        });

        expect(wrapper.findAllComponents(".modal-footer").length).toBe(1);
        expect(wrapper.findComponent(".modal-footer").text()).toBe("test-footer");
    });

});
