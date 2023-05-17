import {shallowMount} from "@vue/test-utils";
import DownloadButton from "../../../app/components/downloadIndicator/DownloadButton.vue"
import {DownloadIcon} from "vue-feather";

describe("download button", () => {

    const downloadProps = {
        name: "downloadIndicator",
        disabled: false
    }
    const mockTranslate = jest.fn()
    const getWrapper = (props = downloadProps) => {
        return shallowMount(DownloadButton, {
            directives: {
                translate: mockTranslate
            },
            props: props
        })
    }

    it('it can render button as expected ', () => {
        const wrapper = getWrapper()
        expect(wrapper.props()).toEqual({
            disabled: false,
            name: "downloadIndicator"
        })
        expect(wrapper.findComponent(".btn").attributes("disabled")).toBeUndefined()
        expect(mockTranslate.mock.calls.length).toBe(1)
        expect(mockTranslate.mock.calls[0][1].value).toBe("downloadIndicator")
    });

    it('it does not render button when disabled prop is true ', () => {
        const wrapper = getWrapper({disabled: true, name: "downloadIndicator"})
        expect(wrapper.findComponent(".btn").attributes("disabled")).toBe("disabled")
    });

    it('it can emit click event ', async() => {
        const wrapper = getWrapper()
        await wrapper.findComponent(".btn").trigger("click")
        expect(wrapper.emitted("click")!?.length).toBe(1)
    });

    it('it can render download icon', () => {
        const wrapper = getWrapper()
        expect(wrapper.findComponent(DownloadIcon).exists()).toBe(true)
        expect(wrapper.findComponent(DownloadIcon).attributes("size")).toBe("20")
        expect(wrapper.findComponent(DownloadIcon).classes()).toEqual(["icon", "ml-2"])
    });
})