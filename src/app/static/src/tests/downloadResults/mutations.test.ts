import {mockDownloadResultsDependency, mockDownloadResultsState, mockError} from "../mocks";
import {DownloadResultsMutation, mutations} from "../../app/store/downloadResults/mutations";
import {DownloadStatusResponse} from "../../app/generated";
import { DownloadType } from "../../app/store/downloadResults/downloadConfig";

describe(`All DownloadType mutations`, () => {
    afterEach(() => {
        vi.useRealTimers();
    })

    it("resets download ids", () => {
        vi.useFakeTimers();
        const clearInterval = vi.spyOn(window, "clearInterval");
        const downloadTypes = Object.values(DownloadType);

        const state = mockDownloadResultsState(
            Object.fromEntries(downloadTypes.map((type, index) => {
                return [
                    type,
                    mockDownloadResultsDependency({ downloadId: `${index + 1}`, statusPollId: index + 1 })
                ];
            }))
        )

        mutations[DownloadResultsMutation.ResetIds](state);

        downloadTypes.forEach((type, index) => {
            expect(state[type].downloadId).toBe("");
            expect(state[type].statusPollId).toBe(-1);
            expect(clearInterval.mock.calls[index][0]).toBe(index + 1);
        });
    })
});

const testDownloadMutation = (type: DownloadType) => {
    const downloadStartedPayload = {id: "P123"}
    const error = mockError("TEST FAILED")
    const errorMsg = {detail: "TEST FAILED", error: "OTHER_ERROR"}
    const CompleteStatusResponse: DownloadStatusResponse = {
        id: "db0c4957aea4b32c507ac02d63930110",
        done: true,
        progress: ["Generating summary report"],
        status: "COMPLETE",
        success: true,
        queue: 0
    }

    it("sets download started on Preparing", () => {
        const state = mockDownloadResultsState();
        const payload = { type, payload: downloadStartedPayload };
        mutations[DownloadResultsMutation.Preparing](state, { payload });
        expect(state[type].preparing).toBe(true);
        expect(state[type].downloadId).toBe("P123");
        expect(state[type].complete).toBe(false);
        expect(state[type].error).toBe(null);
    });

    it("sets download error, clears interval on Error", () => {
        vi.useFakeTimers();
        const clearInterval = vi.spyOn(window, "clearInterval");
        const state = mockDownloadResultsState({
            [type]: mockDownloadResultsDependency({ statusPollId: 1 })
        });
        const payload = { type, payload: error };
        mutations[DownloadResultsMutation.Error](state, { payload });
        expect(state[type].preparing).toBe(false);
        expect(state[type].error).toEqual(errorMsg);
        expect(state[type].statusPollId).toBe(-1);
        expect(clearInterval.mock.calls[0][0]).toBe(1);
    });

    it("sets metadata error", () => {
        const state = mockDownloadResultsState();
        const payload = { type, payload: error };
        mutations[DownloadResultsMutation.MetadataError](state, { payload });
        expect(state[type].metadataError).toEqual(errorMsg);
    });

    it("sets poll started on PollingStatusStarted", () => {
        const state = mockDownloadResultsState();
        const payload = { type, payload: { pollId: 123 }};
        mutations[DownloadResultsMutation.PollingStatusStarted](state, { payload });
        expect(state[type].statusPollId).toBeGreaterThan(-1);
    });

    it("sets summary download error", () => {
        const state = mockDownloadResultsState();
        const payload = { type, payload: error };
        mutations[DownloadResultsMutation.DownloadError](state, { payload });
        expect(state[type].downloadError).toEqual(errorMsg);
    });

    it("sets fetchingDownloadId on SetFetchingDownloadId", () => {
        const state = mockDownloadResultsState();
        const payload = type;
        mutations[DownloadResultsMutation.SetFetchingDownloadId](state, { payload });
        expect(state[type].fetchingDownloadId).toBe(true);
    });

    it("set status to complete, clears interval on StatusUpdated", () => {
        vi.useFakeTimers();
        const clearInterval = vi.spyOn(window, "clearInterval");
        const state = mockDownloadResultsState({
            [type]: {
                preparing: true,
                complete: false,
                error: mockError(),
                downloadError: null,
                statusPollId: 123,
                downloadId: "111",
                fetchingDownloadId: false,
                metadataError: null
            }
        });
        const payload = { type, payload: CompleteStatusResponse };
        mutations[DownloadResultsMutation.StatusUpdated](state, { payload });
        expect(state[type].preparing).toBe(false);
        expect(state[type].complete).toBe(true);
        expect(state[type].error).toBe(null);
        expect(state[type].metadataError).toBe(null);
        expect(state[type].statusPollId).toBe(-1);
        expect(state[type].downloadId).toBe("111");
        expect(clearInterval.mock.calls[0][0]).toBe(123);
    });

    it("sets spectrum download error on SpectrumError", () => {
        vi.useFakeTimers();
        const clearInterval = vi.spyOn(window, "clearInterval");
        const state = mockDownloadResultsState({
            [type]: mockDownloadResultsDependency({ statusPollId: 123 })
        });
        const payload = { type, payload: error };
        mutations[DownloadResultsMutation.Error](state, { payload });
        expect(state[type].preparing).toBe(false);
        expect(state[type].error).toEqual(errorMsg);
        expect(clearInterval.mock.calls[0][0]).toBe(123);
    });
};

describe("Single DownloadType mutation", () => {
    Object.values(DownloadType).forEach(type => testDownloadMutation(type));
});
