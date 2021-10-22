import {shallowMount} from "@vue/test-utils";
import Download from "../../../app/components/downloadResults/Download.vue"

describe(`download`, () => {

    const downloadSummary = {
        downloading: true,
        complete: false,
        downloadId: null,
        error: null
    }

    const downloadTranslate = {
        header: "downloadSummaryReport",
        button: "download"
    }

    const mockDirective = jest.fn()

    const propsData = {
        file: downloadSummary,
        modalOpen: false,
        translateKey: downloadTranslate,
        disabled: false
    }

    const getWrapper = (props = propsData) => {
        return shallowMount(Download,
            {
                propsData: props,
                directives: {"translate": mockDirective}
            })
    }

    it(`renders components as expected`, () => {
        const wrapper = getWrapper()
        expect(mockDirective.mock.calls[0][1].value).toBe("downloadSummaryReport")
        expect(mockDirective.mock.calls[1][1].value).toBe("download")
        expect(wrapper.find("download-icon-stub").exists()).toBe(true)
        expect(wrapper.find("download-progress-stub").props()).toEqual({
            "downloading": true,
            "translateKey": "downloading"
        })
        expect(wrapper.props()).toEqual({
            file: downloadSummary,
            modalOpen: false,
            translateKey: downloadTranslate,
            disabled: false
        })
    })

    it(`does not disable button when upload is not in progress`, () => {
        const wrapper = getWrapper()
        expect(wrapper.find("download-icon-stub").exists()).toBe(true)
        expect(wrapper.find("button").classes()).toEqual(["btn", "btn-lg", "my-3", "btn-red"])
        expect(wrapper.find("button").attributes("disabled")).toBeUndefined()
    })

    it(`disables button when upload is in progress`, () => {
        const wrapper = getWrapper({
            file: downloadSummary,
            modalOpen: false,
            translateKey: downloadTranslate,
            disabled: true
        })

        expect(wrapper.find("download-icon-stub").exists()).toBe(true)
        expect(wrapper.find("button").classes()).toEqual(["btn", "btn-lg", "my-3", "btn-secondary"])
        expect(wrapper.find("button").attributes("disabled")).toBe("disabled")
    })

    it(`can emit download`, async () => {
        const wrapper = getWrapper()
        const downloadSummary = {
            downloading: false,
            complete: false,
            downloadId: null,
            error: null
        }
        const button = wrapper.find("button")
        await wrapper.setProps({file: downloadSummary})
        button.trigger("click")
        expect(wrapper.emitted().click.length).toBe(1)
    })
})