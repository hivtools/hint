import { shallowMount } from "@vue/test-utils";
import OutputTable from "../../../app/components/outputTable/OutputTable.vue";
import TableFilters from "../../../app/components/outputTable/TableFilters.vue";
import TableData from "../../../app/components/outputTable/TableData.vue";

describe("Output Table tests", () => {
    const getWrapper = () => {
        return shallowMount(OutputTable)
    };

    it("renders as expected", () => {
        const wrapper = getWrapper();
        expect(wrapper.findComponent(TableFilters).exists()).toBe(true);
        expect(wrapper.findComponent(TableData).exists()).toBe(true);
    });
});