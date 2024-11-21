import {actions} from "../../app/store/root/actions";
import {actions as projectActions} from "../../app/store/projects/actions";
import {ErrorReportManualDetails} from "../../app/types";
import {emptyState} from "../../app/root";
import {login, rootState} from "./integrationTest";
import { DownloadType } from "../../app/store/downloadResults/downloadConfig";

describe(`root actions`, () => {
    beforeAll(async () => {
        await login();
    });


    it("can post error report", async () => {
        const commit = vi.fn();
        const dispatch = vi.fn();

        const state = {
            ...emptyState(),
            baseline: {
                country: "Malawi"
            },
            modelRun: {
                modelRunId: "1234"
            },
            modelCalibrate: {
                calibrateId: "2022"
            },
            downloadResults: {
                [DownloadType.SPECTRUM]: {
                    downloadId: "spectrum123"
                },
                [DownloadType.SUMMARY]: {
                    downloadId: "summary123"
                },
                [DownloadType.COARSE]: {
                    downloadId: "coarse123"
                },
                [DownloadType.COMPARISON]: {
                    downloadId: "comparison123"
                }
            },
            projects: {currentProject: {name: "v1", id: 1, versions: []}}
        }
        const projectPayload = {name: "v1"}
        await projectActions.createProject({commit, dispatch, rootState, state: state} as any, projectPayload);

        const getters = {
            errors: []
        }

        const payload: ErrorReportManualDetails = {
            email: "test@example.com",
            stepsToReproduce: "steps to reproduce",
            section: "login",
            description: "test"
        }

        // Reset after all setup has completed
        vi.resetAllMocks();
        await actions.generateErrorReport({commit, rootState: state, getters, dispatch} as any, payload);
        expect(commit.mock.calls.length).toBe(3)
        expect(commit.mock.calls[0][0]).toStrictEqual({payload: true, type: "errors/SendingErrorReport"})
        expect(commit.mock.calls[1][0]).toStrictEqual(
            {
                payload: {
                    description: "OK",
                    statusCode: 200
                },
                type: "errors/ErrorReportSuccess"
            });
        expect(commit.mock.calls[2][0]).toStrictEqual({payload: false, type: "errors/SendingErrorReport"})
    });
})
