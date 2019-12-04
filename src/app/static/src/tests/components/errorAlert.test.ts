import { shallowMount} from '@vue/test-utils';
import ErrorAlert from "../../app/components/ErrorAlert.vue";
import {mockError} from "../mocks";

describe("Error alert component", () => {

    it("renders error message", () => {
        const wrapper = shallowMount(ErrorAlert, {
            propsData: {
                error: mockError("Error text")
            }
        });

        expect(wrapper.find("div").text()).toBe("Error text");
        expect(wrapper.find("div").classes()).toStrictEqual(["pt-1", "text-danger"])
    });

});
