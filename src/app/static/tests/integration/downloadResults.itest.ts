import {actions} from "../../src/store/downloadResults/actions";
import {rootState} from "./integrationTest";
import {formatToLocalISODateTime} from "../../src/utils";
import { DownloadType } from "../../src/store/downloadResults/downloadConfig";
import { DownloadResultsState } from "../../src/store/downloadResults/downloadResults";
import { DownloadResultsMutation } from "../../src/store/downloadResults/mutations";

describe(`download results actions integration`, () => {
    Object.values(DownloadType).forEach(type => testDownloadIntegration(type));
})

const interval = 400
const timeout = 6000

const mockRootGetters = {
    projectState: {
        state: {
            datasets: {
                anc: {"filename": "anc", "path": "uploads/ancHash"},
                pjnz: {"filename": "pjnz", "path": "uploads/pjnzHash"},
                population: {"filename": "population", "path": "uploads/populationHash"},
                programme: {"filename": "program", "path": "uploads/programHash"},
                shape: {"filename": "shape", "path": "uploads/shapeHash"},
                survey: {"filename": "survey", "path": "uploads/surveyHash"}
            },
            model_fit: {"id": "", "options": {}},
            calibrate: {"id": "", "options": {}},
            version: {"hintr": "1.0.0", "naomi": "2.0.0", "rrq": "1.1.1"},
        },
        notes: {
            project_notes: {
                name: "My project 123",
                updated: formatToLocalISODateTime("2022-06-09T13:56:19.280Z"),
                note: "These are my project notes"
            },
            version_notes: [
                {
                    name: "My project 123",
                    updated: formatToLocalISODateTime("2022-06-09T13:56:19.280Z"),
                    note: "Notes specific to this version"
                },
                {
                    name: "My project 123",
                    updated: formatToLocalISODateTime("2022-06-09T13:56:19.280Z"),
                    note: "Notes from the first version"
                }
            ]
        }
    }
};

const testDownloadIntegration = (type: DownloadType) => {
    const getStore = (state: Partial<DownloadResultsState> = {}) => {
        const root = {
            ...rootState,
            modelCalibrate: { calibrateId: "calibrate123" }
        };
        return { commit: vi.fn(), dispatch: vi.fn(), state, rootState: root, rootGetters: mockRootGetters }
    };

    it(`can prepare output for download`, async () => {
        const { commit, dispatch, state, rootState, rootGetters } = getStore({ [type]: {} });

        await actions.prepareOutput({ commit, dispatch, state, rootState, rootGetters } as any, type);

        // passing an invalid calibrateId so this will return an error
        // but the expected error message confirms
        // that we're hitting the correct endpoint
        expect(commit.mock.calls.length).toBe(2);
        expect(commit.mock.calls[0][0]["type"]).toBe(DownloadResultsMutation.SetFetchingDownloadId);
        expect(commit.mock.calls[0][0]["payload"]).toBe(type);
        expect(commit.mock.calls[1][0]["type"]).toBe(DownloadResultsMutation.Error);
        expect(commit.mock.calls[1][0]["payload"].payload.detail).toBe("Failed to fetch result");
    });

    it(`can poll for status update`, async () => {
        const { commit, dispatch, state, rootState } = getStore({ [type]: { downloadId: 123 } });

        actions.poll({ commit, dispatch, state, rootState } as any, type, interval);
        // have to wait slightly longer for async functions to finish after setInterval is ran
        await vi.waitUntil(() => commit.mock.calls.length >= 2, { interval, timeout })

        expect(commit.mock.calls[0][0]["type"]).toBe(DownloadResultsMutation.PollingStatusStarted);
        expect(commit.mock.calls[0][0]["payload"].type).toBe(type);
        expect(+commit.mock.calls[0][0]["payload"].payload.pollId).toBeGreaterThan(-1);

        expect(commit.mock.calls[1][0]["type"]).toBe(DownloadResultsMutation.StatusUpdated);
        expect(commit.mock.calls[1][0]["payload"].payload.status).toBe("MISSING");
    });

    it(`does not poll output for status update when downloadId is empty`, async () => {
        const { commit, dispatch, state, rootState } = getStore({ [type]: { downloadId: "" } });

        actions.poll({ commit, dispatch, state, rootState } as any, type, interval);
        await vi.waitUntil(() => commit.mock.calls.length >= 2, { interval, timeout });

        expect(commit.mock.calls[0][0]["type"]).toBe(DownloadResultsMutation.PollingStatusStarted);
        expect(commit.mock.calls[0][0]["payload"].type).toBe(type);
        expect(+commit.mock.calls[0][0]["payload"].payload.pollId).toBeGreaterThan(-1);

        expect(commit.mock.calls[1][0]["type"]).toBe(DownloadResultsMutation.Error);
        expect(commit.mock.calls[1][0]["payload"].payload.detail).toContain("Otherwise please contact support at naomi-support@imperial.ac.uk");
    });
};
