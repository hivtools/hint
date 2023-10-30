import { shallowMount } from "@vue/test-utils";
import TableFilters from "../../../app/components/outputTable/TableFilters.vue";

describe("Output Table filters tests", () => {
    const getWrapper = () => {
        return shallowMount(TableFilters)
    };

    it("renders as expected", () => {
        const wrapper = getWrapper();
        expect(wrapper.find("div").text()).toBe("Filters");
    });
});