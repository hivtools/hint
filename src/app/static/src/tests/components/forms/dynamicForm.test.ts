import Vue from "vue";
import {DynamicFormMeta, MultiSelectControl, NumberControl, SelectControl} from "../../../app/components/forms/types";
import {mount, shallowMount, Wrapper} from "@vue/test-utils";
import DynamicFormComponent from "../../../app/components/forms/DynamicForm.vue";
import DynamicFormControlSection from "../../../app/components/forms/DynamicFormControlSection.vue";

describe('Dynamic form component', function () {

    const fakeFormMeta: DynamicFormMeta = {
        controlSections: [
            {
                label: "Test 1",
                controlGroups: []
            },
            {
                label: "Test 2",
                controlGroups: [{
                    label: "Group 1",
                    controls: [
                        {
                            name: "id_1",
                            type: "number",
                            required: true
                        } as NumberControl,
                        {
                            name: "id_2",
                            type: "number",
                            required: false
                        } as NumberControl
                    ]
                }]
            }
        ]
    };

    const formMetaWithAllControlTypes = {
        ...fakeFormMeta
    };

    formMetaWithAllControlTypes.controlSections[1].controlGroups[0].controls.push({
            name: "id_3",
            type: "multiselect",
            options: [{id: "opt1", label: "option 1"}],
            required: false,
            value: ["opt1", "opt2"]
        } as MultiSelectControl,
        {
            name: "id_4",
            type: "select",
            options: [{id: "opt2", label: "option 2"}],
            required: false
        } as SelectControl,
        {
            name: "id_5",
            type: "multiselect",
            options: [{id: "opt2", label: "option 2"}],
            required: false
        } as SelectControl);

    const getWrapper = (propsData: any, mount: (component: any, options: any) => Wrapper<DynamicFormComponent>) => {
        return mount(DynamicFormComponent, {
            propsData: {
                formMeta: {...fakeFormMeta},
                ...propsData
            },
            sync: false
        });
    };

    it("renders form with id", () => {
        const rendered = getWrapper({id: "test-id"}, mount);
        const form = rendered.find("form");
        expect((form.vm.$refs["test-id"] as Element).tagName).toBe("FORM");
        expect(form.classes()).toContain("dynamic-form")
    });

    it("generates default id if not provided", () => {
        const rendered = getWrapper({}, shallowMount);
        expect(rendered.vm.$props.id).toBe("d-form");
    });

    it("renders control sections", () => {
        const rendered = getWrapper({}, shallowMount);
        expect(rendered.findAll(DynamicFormControlSection).length).toBe(2);
    });

    it("does not render button if includeSubmitButton is false", () => {
        const rendered = getWrapper({includeSubmitButton: false}, shallowMount);
        expect(rendered.findAll("button").length).toBe(0);
    });

    it("button is disabled while required values are missing", () => {
        const rendered = getWrapper({}, shallowMount);
        expect(rendered.find("button").attributes("disabled")).toBe("disabled");
    });

    it("button is enabled when required values are present", () => {
        const formMeta = {
            controlSections: [{
                label: "Test 2",
                controlGroups: [{
                    label: "Group 1",
                    controls: [
                        {
                            name: "id_1",
                            type: "number",
                            required: true,
                            value: 10
                        } as NumberControl,
                        {
                            name: "id_1",
                            type: "number",
                            required: false
                        } as NumberControl
                    ]
                }]
            }]
        };
        const rendered = getWrapper(formMeta, mount);
        expect(rendered.find("button").attributes("disabled")).toBeUndefined();
    });

    it("emits event with serialised form data on button submit", async () => {
        const rendered = getWrapper({formMeta: {...formMetaWithAllControlTypes}}, mount);
        rendered.find("[name=id_1]").setValue(10);
        await Vue.nextTick();

        rendered.find("button").trigger("click");
        expect(rendered.emitted("submit")[0][0]).toStrictEqual({
            "id_1": 10,
            "id_2": null,
            "id_3": ["opt1", "opt2"],
            "id_4": null,
            "id_5": []
        });
    });

    it("emits event and returns serialised form data on programmatic submit", async () => {
        const rendered = getWrapper({formMeta: {...formMetaWithAllControlTypes}}, mount);
        rendered.find("[name=id_1]").setValue(10);
        const expected = {
            "id_1": 10,
            "id_2": null,
            "id_3": ["opt1", "opt2"],
            "id_4": null,
            "id_5": []
        };
        await Vue.nextTick();

        const result = (rendered.vm as any).submit();
        expect(rendered.emitted("submit")[0][0]).toStrictEqual(expected);
        expect(result).toStrictEqual(expected);
    });

});
