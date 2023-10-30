import { shallowMount } from "@vue/test-utils";
import TableData from "../../../app/components/outputTable/TableData.vue";

describe("Output Table display table tests", () => {
    const getWrapper = () => {
        return shallowMount(TableData)
    };

    it("renders as expected", () => {
        const wrapper = getWrapper();
        expect(wrapper.find("div").text()).toBe("Table");
    });
});