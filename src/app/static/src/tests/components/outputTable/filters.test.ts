import { shallowMount } from "@vue/test-utils";
import Filters from "../../../app/components/outputTable/Filters.vue";

describe("Output Table filters tests", () => {
    const getWrapper = () => {
        return shallowMount(Filters)
    };

    it("renders as expected", () => {
        const wrapper = getWrapper();
        expect(wrapper.find("div").text()).toBe("Filters");
    });
});