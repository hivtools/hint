import {mount} from "@vue/test-utils";
import ProgressBar from "../../app/components/progress/ProgressBar.vue";
import {BProgress, BProgressBar} from "bootstrap-vue-next";

describe("progress bar", () => {

    it("renders name without helptext", () => {
        const wrapper = mount(ProgressBar, {
            props: {
                phase: {name: "Phase 1", started: true, complete: false}
            }
        });

        expect(wrapper.find(".title").text()).toBe("Phase 1");
    });

    it("renders name with helptext if present", () => {
        const wrapper = mount(ProgressBar, {
            props: {
                phase: {name: "Phase 1", helpText: "doing a thing", started: true, complete: false}
            }
        });

        expect(wrapper.find(".title").text()).toBe("Phase 1: doing a thing");
    });

    it("has not-started class if not started", () => {
        const wrapper = mount(ProgressBar, {
            props: {
                phase: {name: "Phase 1", started: false, complete: false}
            }
        });

        expect(wrapper.classes()).toStrictEqual(["my-2", "not-started"]);
    });

    it("has in-progress class if in progress", () => {
        const wrapper = mount(ProgressBar, {
            props: {
                phase: {name: "Phase 1", started: true, complete: false}
            }
        });

        expect(wrapper.classes()).toStrictEqual(["my-2", "in-progress"]);
    });

    it("has finished class if finished", () => {
        const wrapper = mount(ProgressBar, {
            props: {
                phase: {name: "Phase 1", started: true, complete: true}
            }
        });

        expect(wrapper.classes()).toStrictEqual(["my-2", "finished"]);
    });

    it("progress bar has given value and is not animated if present", () => {
        const wrapper = mount(ProgressBar, {
            props: {
                phase: {name: "Phase 1", started: true, complete: false, value: 0.1}
            }
        });

        expect(wrapper.findComponent(BProgressBar).props("value")).toBe(0.1);
        expect(wrapper.findComponent(BProgress).props("animated")).toBe(false);
    });

    it("progress bar has value 1 and is animated if no value present", () => {
        const wrapper = mount(ProgressBar, {
            props: {
                phase: {name: "Phase 1", started: true, complete: false}
            }
        });

        expect(wrapper.findComponent(BProgressBar).props("value")).toBe(1);
        expect(wrapper.findComponent(BProgress).props("animated")).toBe(true);
    });

});
