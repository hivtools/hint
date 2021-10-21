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

    const getWrapper = () => {
        return shallowMount(Download,
            {
                propsData: {
                    file: downloadSummary,
                    modalOpen: false,
                    translateKey: downloadTranslate,
                    disable: false
                },
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
            disable: false
        })
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