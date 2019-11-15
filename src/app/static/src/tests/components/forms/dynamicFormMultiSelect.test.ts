import Vue from "vue";
import {shallowMount} from "@vue/test-utils";
import {SelectControl} from "../../../app/components/forms/types";
import TreeSelect from "@riophae/vue-treeselect";
import DynamicFormMultiSelect from "../../../app/components/forms/DynamicFormMultiSelect.vue";

describe('Dynamic form multi-select component', function () {

    const fakeSelect: SelectControl = {
        name: "id_1",
        type: "multiselect",
        required: true,
        options: [{id: "opt1", label: "option 1"}, {id: "opt2", label: "option2"}],
    };

    it("renders treeselect with no value", () => {
        const rendered = shallowMount(DynamicFormMultiSelect, {
            propsData: {
                formControl: fakeSelect
            }
        });

        const treeSelect = rendered.find(TreeSelect);
        expect(treeSelect.props("value")).toStrictEqual([]);
        expect(treeSelect.props("options")).toStrictEqual(fakeSelect.options);
        expect(treeSelect.props("multiple")).toBe(true);
        expect(treeSelect.props("clearable")).toBe(false);
    });

    it("renders treeselect with starting array value", () => {
        const rendered = shallowMount(DynamicFormMultiSelect, {
            propsData: {
                formControl: {...fakeSelect, value: ["opt2"]}
            }
        });

        const treeSelect = rendered.find(TreeSelect);
        expect(treeSelect.props("value")).toStrictEqual(["opt2"]);
        expect(treeSelect.props("options")).toStrictEqual(fakeSelect.options);
    });

    it("renders treeselect with string starting value", () => {
        const rendered = shallowMount(DynamicFormMultiSelect, {
            propsData: {
                formControl: {...fakeSelect, value: "opt2"}
            }
        });

        const treeSelect = rendered.find(TreeSelect);
        expect(treeSelect.props("value")).toStrictEqual(["opt2"]);
        expect(treeSelect.props("options")).toStrictEqual(fakeSelect.options);
    });


    it("initialises hidden input with value", () => {
        const rendered = shallowMount(DynamicFormMultiSelect, {
            propsData: {
                formControl: {...fakeSelect, value: ["opt2"]}
            }
        });

        expect((rendered.find("[name=id_1]").element as HTMLInputElement).value).toBe("opt2");
    });

});