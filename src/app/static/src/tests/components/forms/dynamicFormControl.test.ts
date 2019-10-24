import {mount, shallowMount, Wrapper} from "@vue/test-utils";
import DynamicFormControl from "../../../app/components/forms/DynamicFormControl.vue";
import {NumberControl, SelectControl} from "../../../app/components/forms/types";
import DynamicFormNumberInput from "../../../app/components/forms/DynamicFormNumberInput.vue";
import DynamicFormSelect from "../../../app/components/forms/DynamicFormSelect.vue";
import DynamicFormMultiSelect from "../../../app/components/forms/DynamicFormMultiSelect.vue";
import TreeSelect from '@riophae/vue-treeselect';

describe('Dynamic form control component', function () {

    const fakeNumber: NumberControl = {
        label: "Number label",
        name: "id_1",
        type: "number",
        required: false
    };

    const fakeSelect: SelectControl = {
        name: "id_2",
        type: "select",
        required: true,
        options: [{id: "opt1", label: "option 1"}, {id: "opt2", label: "option2"}]
    };

    const fakeMultiSelect: SelectControl = {
        name: "id_3",
        type: "multiselect",
        required: true,
        options: [{id: "opt1", label: "option 1"}, {id: "opt2", label: "option2"}]
    };

    const getWrapper = (formControl: any, mount: (component: any, options: any) => Wrapper<DynamicFormControl>) => {
        return mount(DynamicFormControl, {
            propsData: {
                formControl: formControl,
            },
            sync: false
        });
    };

    it("renders label if it exists", () => {
        const rendered = getWrapper(fakeNumber, shallowMount);
        expect(rendered.find("label").text()).toBe("Number label");
    });

    it("renders required indicator if input is required", () => {
        const rendered = getWrapper({...fakeNumber, required: true}, shallowMount);
        expect(rendered.find("label").find("span").text()).toBe("(required)");
    });

    it("does not renders label if it does not exist", () => {
        const rendered = getWrapper(fakeSelect, shallowMount);
        expect(rendered.findAll("label").length).toBe(0);
    });

    it("col has given width", () => {
        const rendered = mount(DynamicFormControl, {
            propsData: {
                formControl: fakeNumber,
                colWidth: "3"
            },
            sync: false
        });
        expect(rendered.element.classList).toContain("col-md-3");
    });

    it("renders number input when formControl type is number", () => {
        const control = {...fakeNumber};
        const rendered = getWrapper(control, mount);
        expect(rendered.findAll(DynamicFormNumberInput).length).toBe(1);
        rendered.find("input").setValue(123);
        expect(rendered.emitted("change")[0][0]).toStrictEqual({...control, value: 123})
    });

    it("renders select when formControl type is select", () => {
        const control = {...fakeSelect};
        const rendered = getWrapper(control, mount);
        expect(rendered.findAll(DynamicFormSelect).length).toBe(1);
        rendered.find("select").trigger("change");
        expect(rendered.emitted("change")[0][0]).toStrictEqual({...fakeSelect, value: ""});
    });

    it("renders multi-select when formControl type is multiselect", () => {
        const rendered = getWrapper(fakeMultiSelect, mount);
        expect(rendered.findAll(DynamicFormMultiSelect).length).toBe(1);
        rendered.find(DynamicFormMultiSelect).find(TreeSelect).vm.$emit("input", "opt1");
        expect(rendered.emitted("change")[0][0]).toStrictEqual({...fakeMultiSelect, value: "opt1"})
    });

});