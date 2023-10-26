import { shallowMount } from "@vue/test-utils";
import Table from "../../../app/components/outputTable/Table.vue";

describe("Output Table display table tests", () => {
    const getWrapper = () => {
        return shallowMount(Table)
    };

    it("renders as expected", () => {
        const wrapper = getWrapper();
        expect(wrapper.find("div").text()).toBe("Table");
    });
});