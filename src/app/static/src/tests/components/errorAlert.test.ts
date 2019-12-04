import { shallowMount} from '@vue/test-utils';
import ErrorAlert from "../../app/components/ErrorAlert.vue";
import {mockError} from "../mocks";

describe("Error alert component", () => {

    const noTraceProps =  {
        error: mockError("Error text")
    };

    const traceProps = {
        error: {
            error: "TEST_ERROR_TYPE",
            detail: "Error text",
            trace: ["trace1", "trace2"]
        }
    };

    it("renders error message", () => {
        const wrapper = shallowMount(ErrorAlert, {
            propsData: noTraceProps
        });

        expect(wrapper.find(".error-message").text()).toBe("Error text");
        expect(wrapper.find("div").classes()).toStrictEqual(["pt-1", "text-danger"])
        expect(wrapper.findAll("a").length).toBe(0);
        expect(wrapper.findAll(".error-trace").length).toBe(0);
    });

    it("renders error value if detail is not present", () => {
        const wrapper = shallowMount(ErrorAlert, {
            propsData: {
            error: {
                error: "TEST ERROR TYPE",
                    detail: null
            }
            }
        });

        expect(wrapper.find(".error-message").text()).toBe("TEST ERROR TYPE");
    });

    it("shows details link if trace is present", () => {
        const wrapper = shallowMount(ErrorAlert, {
            propsData: traceProps
        });

        expect(wrapper.find(".error-message").text()).toBe("Error text");
        expect(wrapper.find("div").classes()).toStrictEqual(["pt-1", "text-danger"])
        expect(wrapper.find("a").text()).toBe("show details");
        expect(wrapper.findAll(".error-trace").length).toBe(0);
    });

    it("toggles display of trace when click link", () => {
        const wrapper = shallowMount(ErrorAlert, {
            propsData: traceProps
        });

        const link = wrapper.find("a");
        link.trigger("click");

        expect(link.text()).toBe("hide details");
        const traceMsgs = wrapper.findAll(".error-trace");
        expect(traceMsgs.length).toBe(2);
        expect(traceMsgs.at(0).text()).toBe("trace1");
        expect(traceMsgs.at(1).text()).toBe("trace2");

        link.trigger("click");
        expect(link.text()).toBe("show details");
        expect(wrapper.findAll(".error-trace").length).toBe(0);
    });

});
