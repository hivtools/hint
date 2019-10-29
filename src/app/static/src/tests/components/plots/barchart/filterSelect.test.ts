import FilterSelect from "../../../../app/components/plots/barchart/FilterSelect.vue";
import {createLocalVue, shallowMount} from "@vue/test-utils";

const localVue = createLocalVue();

const propsData = {
    id: "test",
    options: [{id: "fo1", label: "option 1"}, {id: "fo2", label: "option 2"}],
    isXAxis: true,
    isDisaggregateBy: false,
    value: [{id: "fo2", label: "option 2"}],
    label: "Test Filter"
};

const getWrapper = (props: any = {}) => {
    return shallowMount(FilterSelect, {propsData: {...propsData, ...props}, localVue});
};

describe("FilterSelect component", () => {
    it("renders as expected", () => {
        const  wrapper = getWrapper();

        const label = wrapper.find("label");
        expect(label.text()).toBe("Test Filter");

        const treeSelect = wrapper.find("tree-select-stub");
        expect(treeSelect.attributes("instanceid")).toBe("test");
        expect(treeSelect.attributes("multiple")).toBe("true");
        expect(treeSelect.attributes("flat")).toBe("true");

        const badge = wrapper.find("span");
        expect(badge.text()).toBe("x axis");
    });

    it("initialises selected", () => {
        const  wrapper = getWrapper();
        const vm = (wrapper as any).vm;

        expect(vm.selected).toStrictEqual([{id: "fo2", label: "option 2"}]);
    });

    it("emits input event on select when isXAxisOrDisAgg", () => {
        const wrapper = getWrapper();
        const vm = (wrapper as any).vm;

        vm.select({id: "fo1", label: "option 1"});
        expect(wrapper.emitted("input")[0][0]).toStrictEqual([
            {id: "fo2", label: "option 2"}, {id: "fo1", label: "option 1"}]);
    });

    it("emits input event on select when not isXAxisOrDisAgg", () => {
        const wrapper = getWrapper({isXAxis: false, isDisaggregateBy: false});
        const vm = (wrapper as any).vm;

        vm.select({id: "fo1", label: "option 1"});
        expect(wrapper.emitted("input")[0][0]).toStrictEqual([{id: "fo1", label: "option 1"}]);
    });

    it("emits input event on deselect", () => {
        const wrapper = getWrapper();
        const vm = (wrapper as any).vm;

        vm.deselect({id: "fo2", label: "option 2"});
        expect(wrapper.emitted("input")[0][0]).toStrictEqual([]);
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
    });

    it("updates selected when isXAxisOrDisagg changes and multiple selected", () => {
        const wrapper = getWrapper();
        const vm = (wrapper as any).vm;
        vm.selected =  [{id: "fo2", label: "option 2"}, {id: "fo1", label: "option 1"}];

        wrapper.setProps({isXAxis: false, isDisaggregateBy: false});
        expect(wrapper.emitted("input")[0][0]).toStrictEqual([{id: "fo2", label: "option 2"}]);
    });

    it("updates selected when isXAxisOrDisagg changes and none selected", () => {
        const wrapper = getWrapper();
        const vm = (wrapper as any).vm;
        vm.deselect({id: "fo2", label: "option 2"});

        wrapper.setProps({isXAxis: false, isDisaggregateBy: false});
        expect(wrapper.emitted("input")[0][0]).toStrictEqual([{id: "fo1", label: "option 1"}]);
    });
});