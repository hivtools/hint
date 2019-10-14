import {DynamicForm, NumberControl} from "../../../app/components/forms/fakeFormMeta";
import {mount, shallowMount} from "@vue/test-utils";
import DynamicFormComponent from "../../../app/components/forms/DynamicForm.vue";
import DynamicFormControlSection from "../../../app/components/forms/DynamicFormControlSection.vue";

describe('Dynamic form component', function () {

    const fakeFormMeta: DynamicForm = {
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
                        } as NumberControl
                    ]
                }]
            }
        ]
    };

    it("renders form with id", () => {
        const rendered = mount(DynamicFormComponent, {
            propsData: {
                formMeta: fakeFormMeta,
                id: "test-id"
            }
        });

        const form = rendered.find("form");
        expect((form.vm.$refs["test-id"] as Element).tagName).toBe("FORM");
        expect(form.classes()).toContain("dynamic-form")
    });

    it("generates default id if not provided", () => {
        const rendered = shallowMount(DynamicFormComponent, {
            propsData: {
                formMeta: fakeFormMeta
            }
        });

        expect(rendered.vm.$props.id).toBeDefined();
    });

    it("renders control sections", () => {
        const rendered = shallowMount(DynamicFormComponent, {
            propsData: {
                formMeta: fakeFormMeta
            }
        });

        expect(rendered.findAll(DynamicFormControlSection).length).toBe(2);
        expect(rendered.findAll(DynamicFormControlSection).at(0).props("controlSection"))
            .toStrictEqual({
                label: "Test 1",
                controlGroups: []
            });
    });

    it("emits event with serialised form data on button submit", () => {

        const rendered = mount(DynamicFormComponent, {
            propsData: {
                formMeta: fakeFormMeta
            }
        });

        rendered.find("input").setValue(10);
        rendered.find("button").trigger("click");
        expect(rendered.emitted("submit")[0][0]).toStrictEqual({"id_1": "10"});
    });

    it("emits event and returns serialised form data on programmatic submit", () => {

        const rendered = mount(DynamicFormComponent, {
            propsData: {
                formMeta: fakeFormMeta
            }
        });

        rendered.find("input").setValue(10);
        const result = (rendered.vm as any).submit();
        expect(rendered.emitted("submit")[0][0]).toStrictEqual({"id_1": "10"});
        expect(result).toStrictEqual({"id_1": "10"});
    });

    it("does not render button if includeSubmitButton is false", () => {

        const rendered = mount(DynamicFormComponent, {
            propsData: {
                formMeta: fakeFormMeta,
                includeSubmitButton: false
            }
        });

        expect(rendered.findAll("button").length).toBe(0);
    });


});