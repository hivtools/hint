import {mount} from "@vue/test-utils";
import DynamicFormControl from "../../../app/components/forms/DynamicFormControl.vue";
import {SelectControl} from "../../../app/components/forms/fakeFormMeta";

describe('Dynamic form select component', function () {

    const fakeSelect: SelectControl = {
        name: "id_2",
        type: "select",
        required: true,
        options: ["opt1", "opt2"],
        default: "opt2"
    };

    it("renders options", () => {
        const rendered = mount(DynamicFormControl, {
            propsData: {
                control: fakeSelect
            }
        });

        const options = rendered.find("select").element.innerHTML;
        expect(options).toBe("<option value=\"opt1\">opt1</option><option value=\"opt2\">opt2</option>");
    });

    it("default is selected if present", () => {
        const rendered = mount(DynamicFormControl, {
            propsData: {
                control: fakeSelect
            }
        });

        const select = rendered.find("select");
        expect((select.element as HTMLSelectElement).value).toBe("opt2");
    });

    it("displays 'choose option' message if default is not given", () => {
        const rendered = mount(DynamicFormControl, {
            propsData: {
                control: {...fakeSelect, default: null}
            }
        });

        const select = rendered.find("select");
        expect((select.element as HTMLSelectElement).value).toBe("");
        expect(select.findAll("option").at(0).text()).toBe("Select...")
    });

});