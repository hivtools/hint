import {actions} from "../../app/store/root/actions";
import {mockBaselineState, mockError, mockModelRunState, mockProjectsState, mockRootState} from "../mocks";
import {ErrorReportManualDetails} from "../../app/store/root/actions";
import {rootState} from "./integrationTest";

describe(`root actions`, () => {

    it("can post error report", async () => {
        const commit = jest.fn();

        const dispatch = jest.fn();

        const state = mockRootState({
            errorReportError: mockError("Err"),
            ...rootState,
            baseline: mockBaselineState({
                country: "Malawi"
            }),
            modelRun: mockModelRunState({
                modelRunId: "1234"
            }),
            projects: mockProjectsState({
                currentProject: {name: "p1", id: 1, versions: []}
            })
        });

        const getters = {
            errors: []
        }

        const payload: ErrorReportManualDetails = {
            email: "test@example.com",
            stepsToReproduce: "steps to reproduce",
            section: "login",
            description: "test"
        }

        await actions.generateErrorReport({commit, rootState: state, getters, dispatch} as any, payload);
        expect(commit.mock.calls[0][0].payload).toStrictEqual(
            {
                detail: "Could not parse API response. Please contact support.",
                error: "MALFORMED_RESPONSE"
            });

        expect(commit.mock.calls[0][0].type).toStrictEqual("errors/ErrorAdded");
        expect(dispatch.mock.calls.length).toBe(0)
    });
})