import { shallowMount } from "@vue/test-utils";
import OutputTable from "../../../app/components/outputTable/OutputTable.vue";
import Filters from "../../../app/components/outputTable/Filters.vue";
import Table from "../../../app/components/outputTable/Table.vue";

describe("Output Table tests", () => {
    const getWrapper = () => {
        return shallowMount(OutputTable)
    };

    it("renders as expected", () => {
        const wrapper = getWrapper();
        expect(wrapper.findComponent(Filters).exists()).toBe(true);
        expect(wrapper.findComponent(Table).exists()).toBe(true);
    });
});