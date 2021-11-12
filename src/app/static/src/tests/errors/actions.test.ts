import {actions, ErrorReport, ErrorReportManualDetails} from "../../app/store/errors/actions";
import {
    mockAxios,
    mockFailure,
    mockBaselineState,
    mockError,
    mockHintrVersionState,
    mockModelRunState,
    mockProjectsState,
    mockRootState,
    mockSuccess
} from "../mocks";
import {ErrorsMutation} from "../../app/store/errors/mutations";
import {currentHintVersion} from "../../app/hintVersion";


describe("errors actions", () => {

    beforeEach(() => {
        mockAxios.reset();
    });

    it("posts error report to teams", async () => {
        const url = "error-report"

        mockAxios.onPost(url)
            .reply(200, mockSuccess("ok"));

        const rootState = mockRootState({
            baseline: mockBaselineState({
                country: "Malawi"
            }),
            modelRun: mockModelRunState({
                modelRunId: "1234"
            }),
            projects: mockProjectsState({
                currentProject: {name: "p1", id: 1, versions: []}
            }),
            hintrVersion: mockHintrVersionState({
                hintrVersion: {
                    naomi: "v1",
                    hintr: "v2",
                    rrq: "v3",
                    traduire: "v4"
                }
            })
        });

        const err = mockError("err")
        const getters = {
            errors: [err]
        }
        const commit = jest.fn();
        const dispatch = jest.fn();

        const payload: ErrorReportManualDetails = {
            email: "test@example.com",
            stepsToReproduce: "repro",
            section: "reviewInputs",
            description: "desc"
        }

        await actions.generateErrorReport({commit, rootState, getters, dispatch} as any, payload);

        expect(commit.mock.calls.length).toEqual(1);
        expect(commit.mock.calls[0][0]).toEqual({"payload": "ok", "type": "ErrorReportSuccess"});
        expect(dispatch.mock.calls.length).toEqual(1);
        expect(dispatch.mock.calls[0][0]).toEqual("projects/cloneProject");
        expect(mockAxios.history.post.length).toEqual(1)
        expect(mockAxios.history.post[0].url).toEqual(url)

        const expected = {
            email: "test@example.com",
            country: "Malawi",
            projectName: "p1",
            timeStamp: new Date(),
            jobId: "1234",
            description: "desc",
            section: "reviewInputs",
            stepsToReproduce: "repro",
            errors: getters.errors

        };

        const data = JSON.parse(mockAxios.history.post[0].data) as ErrorReport

        expect(data.email).toStrictEqual(expected.email)
        expect(data.country).toStrictEqual(expected.country)
        expect(data.projectName).toStrictEqual(expected.projectName)
        expect(data.browserAgent).toContain("Mozilla")
        expect(data.jobId).toStrictEqual(expected.jobId)
        expect(new Date(data.timeStamp).getDate()).toBe(expected.timeStamp.getDate());
        expect(data.description).toStrictEqual(expected.description)
        expect(data.section).toStrictEqual(expected.section)
        expect(data.stepsToReproduce).toStrictEqual(expected.stepsToReproduce)
        expect(data.errors).toStrictEqual(expected.errors)
        expect(data.versions).toStrictEqual({
            naomi: "v1",
            hintr: "v2",
            rrq: "v3",
            traduire: "v4",
            hint: currentHintVersion
        });
    });

    it("sends default values when country, project or jobId are missing", async () => {
        const url = "error-report"

        mockAxios.onPost(url)
            .reply(200, mockSuccess("ok"));

        const rootState = mockRootState({
            baseline: mockBaselineState(),
            modelRun: mockModelRunState(),
            projects: mockProjectsState(),
            hintrVersion: mockHintrVersionState({
                hintrVersion: {
                    naomi: "v1",
                    hintr: "v2",
                    rrq: "v3",
                    traduire: "v4"
                }
            })
        });

        const err = mockError("err")
        const getters = {
            errors: [err]
        }
        const commit = jest.fn();
        const dispatch = jest.fn();

        const payload: ErrorReportManualDetails = {
            email: "test@example.com",
            stepsToReproduce: "repro",
            section: "reviewInputs",
            description: "desc"
        }

        await actions.generateErrorReport({commit, rootState, getters, dispatch} as any, payload);

        expect(commit.mock.calls.length).toEqual(1);
        expect(commit.mock.calls[0][0]).toEqual({"payload": "ok", "type": "ErrorReportSuccess"});
        expect(dispatch.mock.calls.length).toEqual(0);
        expect(mockAxios.history.post.length).toEqual(1)
        expect(mockAxios.history.post[0].url).toEqual(url)


        const expected = {
            email: "test@example.com",
            country: "no associated country",
            projectName: "no associated project",
            timeStamp: new Date(),
            jobId: "no associated jobId",
            description: "desc",
            section: "reviewInputs",
            stepsToReproduce: "repro",
            errors: getters.errors
        };

        const data = JSON.parse(mockAxios.history.post[0].data) as ErrorReport

        expect(data.email).toStrictEqual(expected.email)
        expect(data.country).toStrictEqual(expected.country)
        expect(data.projectName).toBe(expected.projectName)
        expect(data.jobId).toStrictEqual(expected.jobId)
        expect(data.browserAgent).toContain("Mozilla")
        expect(new Date(data.timeStamp).getDate()).toBe(expected.timeStamp.getDate());
        expect(data.description).toStrictEqual(expected.description)
        expect(data.section).toStrictEqual(expected.section)
        expect(data.stepsToReproduce).toStrictEqual(expected.stepsToReproduce)
        expect(data.errors).toStrictEqual(expected.errors)
    });

    it("can return error when error report fails", async () => {
        const url = "error-report"

        mockAxios.onPost(url)
            .reply(500, mockFailure("TestError"));

        const rootState = mockRootState();

        const commit = jest.fn();

        const dispatch = jest.fn();

        const getters = {
            errors: []
        }

        const payload: ErrorReportManualDetails = {
            email: "",
            stepsToReproduce: "",
            section: "",
            description: ""
        }

        await actions.generateErrorReport({commit, rootState, getters, dispatch} as any, payload);

        const expectedError = {error: "OTHER_ERROR", detail: "TestError"};
        expect(commit.mock.calls[0][0]).toEqual({payload: expectedError, type: ErrorsMutation.ErrorReportError});
        expect(dispatch.mock.calls.length).toBe(0)
    });
});
