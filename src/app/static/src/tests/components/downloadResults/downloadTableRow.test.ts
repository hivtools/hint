import Vuex from "vuex";
import { emptyState } from "../../../app/root";
import DownloadTableRow from "../../../app/components/downloadResults/DownloadTableRow.vue";
import { mockDownloadResultsState } from "../../mocks";
import { mount } from "@vue/test-utils";
import { DownloadType, fileTypeUIConfigs, statusUIConfigs, TaskStatus } from "../../../app/store/downloadResults/downloadConfig";
import { DownloadResultsDependency } from "../../../app/types";
import VueFeather from "vue-feather";

const downloadType = DownloadType.SUMMARY;
const downloadStatus = TaskStatus.RUNNING;

describe("Download Table Row tests", () => {
    const getWrapper = (downloadDepState: Partial<DownloadResultsDependency> = {}) => {
        const mockState = mockDownloadResultsState()[downloadType];
        const store = new Vuex.Store({
            state: emptyState(),
            modules: {
                downloadResults: {
                    namespaced: true,
                    state: mockDownloadResultsState({ [downloadType]: { ...mockState, ...downloadDepState } })
                }
            }
        });
        return mount(DownloadTableRow, {
            global: { plugins: [store] },
            props: { type: downloadType }
        })
    };

    const mockLink = {click: vi.fn(), remove: vi.fn()};

    it("renders as expected", () => {
        const wrapper = getWrapper({ statusResponse: { done: false, status: downloadStatus } as any });
        const icons = wrapper.findAllComponents(VueFeather);
        expect(icons.length).toBe(3);
        const [ fileTypeIcon, statusIcon, downloadIcon ] = icons;
        expect(fileTypeIcon.props("type")).toBe(fileTypeUIConfigs[downloadType].icon);
        expect(wrapper.find(".file-type-text").text()).toBe(fileTypeUIConfigs[downloadType].text.toUpperCase());
        expect(statusIcon.props("type")).toBe(statusUIConfigs[downloadStatus].icon);
        const statusText = downloadStatus[0].toUpperCase() + downloadStatus.substring(1).toLowerCase();
        expect(wrapper.find(".dot-dot-dot").text()).toBe(statusText);
        expect(wrapper.find("button").element.disabled).toBe(true);
        expect(downloadIcon.props("type")).toBe("download");
    });

    it("cannot download output while preparing", () => {
        const wrapper = getWrapper({ preparing: true, downloadId: "1" });
        const button = wrapper.find("button");
        expect(button.element.disabled).toBe(true);
    });

    it("cannot download output if downloadId does not exist", async () => {
        const wrapper = getWrapper();
        const button = wrapper.find("button");
        expect(button.element.disabled).toBe(true);
    });

    it("can download file once prepared", async () => {
        const wrapper = getWrapper({
            preparing: false,
            complete: true,
            error: null,
            downloadId: "123"
        });

        vi.spyOn(document, "createElement").mockReturnValue(mockLink as any);

        const button = wrapper.find("button");
        await button.trigger("click")
        expect(document.createElement).toHaveBeenCalledTimes(1);
        expect(document.createElement).toHaveBeenCalledWith("a");
        expect(mockLink.click).toHaveBeenCalledTimes(1);
        expect((mockLink as any).href).toBe("/download/result/123");
        expect((mockLink as any).download).toBe("downloaded_file");
    });
});
