import {actions} from "../../app/store/errors/actions";
import {ErrorReportManualDetails} from "../../app/store/errors/actions";
import {ErrorsState} from "../../app/store/errors/errors";

describe(`errors actions`, () => {

    it("can post error report", async () => {
        const commit = jest.fn();

        const dispatch = jest.fn();

        const state = {
            errorReportError: null,
        } as ErrorsState;

        const getters = {
            errors: []
        }

        const payload: ErrorReportManualDetails = {
            email: "test@example.com",
            stepsToReproduce: "steps to reproduce",
            section: "login",
            description: "test"
        }

        await actions.generateErrorReport({commit, errorsState: state, getters, dispatch} as any, payload);
        expect(commit.mock.calls[0][0]).toStrictEqual(
            {
                payload: {
                    description: "OK",
                    statusCode: 200
                },
                type: "ErrorReportSuccess"
            });

        expect(dispatch.mock.calls.length).toBe(1)
        expect(dispatch.mock.calls[0][0]).toEqual("projects/cloneProject")
        expect(dispatch.mock.calls[0][1]).toEqual(
            {
                "emails": ["naomi-support@imperial.ac.uk"],
                "projectId": 1
            })
    });
})
