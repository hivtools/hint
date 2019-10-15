import {shallowMount} from "@vue/test-utils";
import {BCol} from "bootstrap-vue";
import DynamicFormControlGroup from "../../../app/components/forms/DynamicFormControlGroup.vue";
import DynamicFormControl from "../../../app/components/forms/DynamicFormControl.vue";
import {DynamicControlGroup, NumberControl, SelectControl} from "../../../app/components/forms/fakeFormMeta";

describe('Dynamic form control group component', function () {

    const fakeFormGroup: DynamicControlGroup = {
        label: "Test 1",
        controls: [
            {
                name: "id_1",
                type: "number",
                required: true
            } as NumberControl,
            {
                name: "id_2",
                type: "select",
                required: true
            } as SelectControl
        ]
    };

    it("renders label if it exists", () => {
        const rendered = shallowMount(DynamicFormControlGroup, {
            propsData: {
                controlGroup: fakeFormGroup
            }
        });

        const labelCol = rendered.find(BCol);
        expect(labelCol.find("label").text()).toBe("Test 1");
        expect(labelCol.attributes("md")).toBe("3");
    });

    it("does not render label col if there is no label", () => {
        const rendered = shallowMount(DynamicFormControlGroup, {
            propsData: {
                controlGroup: {...fakeFormGroup, label: null}
            }
        });

        expect(rendered.findAll(BCol).length).toBe(0);
    });

    it("renders controls", () => {
        const rendered = shallowMount(DynamicFormControlGroup, {
            propsData: {
                controlGroup: {...fakeFormGroup}
            }
        });

        expect(rendered.findAll(DynamicFormControl).length).toBe(2);
        expect(rendered.findAll(DynamicFormControl).at(0).props("formControl")).toStrictEqual({
            name: "id_1",
            type: "number",
            required: true
        });
    });

    it("double controls are 3 cols", () => {
        const rendered = shallowMount(DynamicFormControlGroup, {
            propsData: {
                controlGroup: fakeFormGroup
            }
        });

        expect(rendered.findAll(DynamicFormControl).length).toBe(2);
        expect(rendered.findAll(DynamicFormControl).at(0).props("colWidth")).toBe("3");
    });

    it("single controls are 6 cols", () => {
        const rendered = shallowMount(DynamicFormControlGroup, {
            propsData: {
                controlGroup: {...fakeFormGroup, controls: fakeFormGroup.controls.slice(0, 1)}
            }
        });

        expect(rendered.findAll(DynamicFormControl).length).toBe(1);
        expect(rendered.findAll(DynamicFormControl).at(0).props("colWidth")).toBe("6");
    });

});