import {shallowMount} from "@vue/test-utils";
import Modal from "../../app/components/Modal.vue";

describe("modal", () => {

    it("is displayed when open is true", () => {

        const wrapper = shallowMount(Modal, {
            propsData: {
                open: true
            }
        });
        expect(wrapper.find(".modal").element.style.display).toBe("block");
        expect(wrapper.findAll(".modal-backdrop").length).toBe(1);
    });

    it("is not displayed when open is false", () => {

        const wrapper = shallowMount(Modal, {
            propsData: {
                open: false
            }
        });

        expect(wrapper.find(".modal").element.style.display).toBe("none");
        expect(wrapper.findAll(".modal-backdrop").length).toBe(0);
    });

    it("displays child content in body", () => {

        const wrapper = shallowMount(Modal, {
            propsData: {
                open: true
            },
            slots: {
                default: "TEST"
            }
        });

        expect(wrapper.find(".modal-body").text()).toBe("TEST");
    });

    it("does not include footer if footer slot is missing", () => {
        const wrapper = shallowMount(Modal, {
            propsData: {
                open: true
            },
            slots: {
                default: "TEST"
            }
        });

        expect(wrapper.findAll(".modal-footer").length).toBe(0);
    });

    it("includes footer slot if provided", () => {
        const wrapper = shallowMount(Modal, {
            propsData: {
                open: true
            },
            slots: {
                default: "TEST",
                footer: "test-footer"
            }
        });

        expect(wrapper.findAll(".modal-footer").length).toBe(1);
        expect(wrapper.find(".modal-footer").text()).toBe("test-footer");
    });

});
