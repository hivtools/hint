import { nextTick } from "vue";
import FilterSelect from "../../src/bar/FilterSelect.vue";
import {shallowMount} from "@vue/test-utils";
import {mountWithTranslate} from "../../../../tests/testHelpers";

const defaultProps = () => {
    return {
        id: "test",
        options: [{id: "fo1", label: "option 1"}, {id: "fo2", label: "option 2"}],
        isXAxis: true,
        isDisaggregateBy: false,
        value: [{id: "fo2", label: "option 2"}],
        label: "Test Filter"
    }
};

const getWrapper = (props: any = {}) => {
    return shallowMount(FilterSelect, {props: {...defaultProps(), ...props}});
};

describe("FilterSelect component", () => {
    it("renders as expected", () => {
        const  wrapper = getWrapper();

        const label = wrapper.find("label");
        expect(label.text()).toBe("Test Filter");

        const treeSelect = wrapper.find("hint-tree-select-stub");
        expect(treeSelect.attributes("instanceid")).toBe("test");
        expect(treeSelect.attributes("multiple")).toBe("true");
        expect(treeSelect.attributes("flat")).toBe("true");

        const badge = wrapper.find("span");
        expect(badge.text()).toBe("x axis");
    });

    it("initialises selected", () => {
        const  wrapper = getWrapper({value: [{id: "fo1", label: "option 1"}, {id: "fo2", label: "option 2"}]});
        const vm = (wrapper as any).vm;

        expect(vm.selected).toStrictEqual([{id: "fo1", label: "option 1"}, {id: "fo2", label: "option 2"}]);
    });

    it("initialises selected when not xAxis or disAgg", () => {
        const  wrapper = getWrapper({
                isXAxis: false,
                value: [{id: "fo1", label: "option 1"}, {id: "fo2", label: "option 2"}]
        });
        const vm = (wrapper as any).vm;

        expect(vm.selected).toStrictEqual([{id: "fo1", label: "option 1"}]);
    });

    it("emits input event on select when isXAxisOrDisAgg", () => {
        const wrapper = getWrapper();
        const vm = (wrapper as any).vm;

        vm.select({id: "fo1", label: "option 1"});
        expect(wrapper.emitted("update:filter-select")![0][0]).toStrictEqual([
            {id: "fo2", label: "option 2"}, {id: "fo1", label: "option 1"}]);
    });

    it("emits input event on select when not isXAxisOrDisAgg", () => {
        const wrapper = getWrapper({isXAxis: false, isDisaggregateBy: false});
        const vm = (wrapper as any).vm;

        vm.select({id: "fo1", label: "option 1"});
        expect(wrapper.emitted("update:filter-select")![0][0]).toStrictEqual([{id: "fo1", label: "option 1"}]);
    });

    it("emits input event on deselect", () => {
        const wrapper = getWrapper();
        const vm = (wrapper as any).vm;

        vm.deselect({id: "fo2", label: "option 2"});
        expect(wrapper.emitted("update:filter-select")![0][0]).toStrictEqual([]);
    });

    it("computes isXAxisOrDisagg", () => {
        let wrapper = getWrapper();
        let vm = (wrapper as any).vm;
        expect(vm.isXAxisOrDisagg).toEqual(true);

        wrapper = getWrapper({isXAxis: false, isDisaggregateBy: true});
        vm = (wrapper as any).vm;
        expect(vm.isXAxisOrDisagg).toEqual(true);

        wrapper = getWrapper({isXAxis: false, isDisaggregateBy: false});
        vm = (wrapper as any).vm;
        expect(vm.isXAxisOrDisagg).toEqual(false);
    });

    it("computes selectedValues", () => {
        const wrapper = getWrapper();
        const vm = (wrapper as any).vm;
        expect(vm.selectedValues).toStrictEqual(["fo2"]);
    });

    it("computes badge", () => {
        let wrapper = getWrapper();
        let vm = (wrapper as any).vm;
        expect(vm.badge).toEqual("x axis");

        wrapper = getWrapper({isXAxis: false, isDisaggregateBy: true});
        vm = (wrapper as any).vm;
        expect(vm.badge).toEqual("disaggregate by");

        wrapper = getWrapper({isXAxis: true, isDisaggregateBy: true});
        vm = (wrapper as any).vm;
        expect(vm.badge).toEqual("x axis");
    });

    it("updates selected when isXAxisOrDisagg changes and multiple selected", async () => {
        const wrapper = getWrapper();
        const vm = (wrapper as any).vm;
        vm.selected =  [{id: "fo2", label: "option 2"}, {id: "fo1", label: "option 1"}];
        await nextTick();

        await wrapper.setProps({isXAxis: false, isDisaggregateBy: false});

        expect(wrapper.emitted("update:filter-select")![0][0]).toStrictEqual([{id: "fo2", label: "option 2"}]);
    });

    it("updates selected when isXAxisOrDisagg changes and none selected", async () => {
        const wrapper = getWrapper();
        const vm = (wrapper as any).vm;
        vm.deselect({id: "fo2", label: "option 2"});
        await nextTick();

        await wrapper.setProps({isXAxis: false, isDisaggregateBy: false});

        expect(wrapper.emitted("update:filter-select")![0][0]).toStrictEqual([{id: "fo1", label: "option 1"}]);
    });

    it("updates selected before triggering update event when changed via value change", async () => {
        const  wrapper = getWrapper({
            isXAxis: true,
            value: [{id: "fo1", label: "option 1"}, {id: "fo2", label: "option 2"}]
        });

        await wrapper.setProps({ value: [{id: "fo2", label: "option 2"}], isXAxis: false })
        expect(wrapper.emitted("update:filter-select")![0][0]).toStrictEqual([{id: "fo2", label: "option 2"}]);
    });
});
