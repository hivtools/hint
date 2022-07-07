import {shallowMount} from "@vue/test-utils";
import ProjectUploadButton from "../../../app/components/projects/ProjectUploadButton.vue"

describe('project upload button', () => {

    const mockTranslate = jest.fn()
    const mockUploadProject = jest.fn()

    const getWrapper = () => {
        return shallowMount(ProjectUploadButton, {
            directives: {
                translate: mockTranslate
            },
            propsData: {
                uploadProject: mockUploadProject
            }
        })
    }

    it('should render component', () => {
        const wrapper = getWrapper()
        expect(wrapper.find("#project-upload-button").exists()).toBe(true)
        expect(mockTranslate.mock.calls[0][1].value).toBe("uploadFromZip")
    });

    it('should trigger file upload ', () => {
        const wrapper = getWrapper()
        wrapper.find("#project-upload-input").trigger("change")
        expect(mockUploadProject.mock.calls.length).toBe(1)
    });
});