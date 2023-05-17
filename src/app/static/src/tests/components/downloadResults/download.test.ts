import {mount, shallowMount, VueWrapper} from "@vue/test-utils";
import Download from "../../../app/components/downloadResults/Download.vue"
import {mockDownloadResultsDependency} from "../../mocks";
import DownloadStatus from "../../../app/components/downloadResults/DownloadStatus.vue";

describe(`download`, () => {

    const downloadSummary = mockDownloadResultsDependency({
        preparing: true
    })

    const downloadTranslate = {
        header: "downloadSummaryReport",
        button: "download"
    }

    const mockDirective = jest.fn()

    const defaultProps = {
        file: downloadSummary,
        modalOpen: false,
        translateKey: downloadTranslate,
        disabled: false
    }

    const getWrapper = (props = defaultProps) => {
        return shallowMount(Download,
            {
                props: props,
                directives: {"translate": mockDirective}
            })
    }

    it(`renders components as expected`, () => {
        const wrapper = getWrapper()
        expect(mockDirective.mock.calls[0][1].value).toBe("downloadSummaryReport")
        expect(mockDirective.mock.calls[1][1].value).toBe("download")
        expect(wrapper.findComponent("download-icon-stub").exists()).toBe(true)
        expect((wrapper.findComponent("download-status-stub") as VueWrapper).props()).toEqual({
            "preparing": true,
            "translateKey": "preparing"
        })
        expect(wrapper.props()).toEqual({
            file: downloadSummary,
            translateKey: downloadTranslate,
            disabled: false
        })
    })

    it(`does not disable button when upload is not in progress`, () => {
        const wrapper = getWrapper()
        expect(wrapper.findComponent("download-icon-stub").exists()).toBe(true)
        expect(wrapper.findComponent("button").classes()).toEqual(["btn", "btn-lg", "my-3", "btn-red"])
        expect(wrapper.findComponent("button").attributes("disabled")).toBeUndefined()
    })

    it(`disables button when upload is in progress`, () => {
        const wrapper = getWrapper({
            ...defaultProps,
            disabled: true
        })

        expect(wrapper.findComponent("download-icon-stub").exists()).toBe(true)
        expect(wrapper.findComponent("button").classes()).toEqual(["btn", "btn-lg", "my-3", "btn-secondary"])
        expect(wrapper.findComponent("button").attributes("disabled")).toBe("disabled")
    })

    it(`can emit download`, async () => {
        const wrapper = getWrapper()
        const downloadSummary = mockDownloadResultsDependency();

        const button = wrapper.findComponent("button")
        await wrapper.setProps({file: downloadSummary})
        button.trigger("click")
        expect(wrapper.emitted().click.length).toBe(1)
    })

    it("shows download status iff preparing file", async () => {
        const wrapper = shallowMount(DownloadStatus, {
            props: {
                preparing: true,
                translateKey: "preparing"
            },
            directives: {"translate": mockDirective}
        });
        expect(wrapper.findComponent("#preparing").exists()).toBe(true);

        await wrapper.setProps({
           preparing: false
        })
        expect(wrapper.findComponent("#preparing").exists()).toBe(false);
    })
})
