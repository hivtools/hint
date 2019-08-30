import {api} from "../app/apiService";
import {mockAxios, mockFailure, mockSuccess} from "./mocks";
import {Commit} from "vuex";

describe("ApiService", () => {

    beforeEach(() => {
        console.log = jest.fn();
        console.warn = jest.fn();
    });

    afterEach(() => {
        (console.log as jest.Mock).mockClear();
        (console.warn as jest.Mock).mockClear();
    });

    it("console logs error", async () => {
        mockAxios.onGet(`/baseline/`)
            .reply(500, mockFailure("some error message"));

        try {
            await api(jest.fn())
                .get("/baseline/")
        } catch (e) {

        }
        expect((console.warn as jest.Mock).mock.calls[0][0])
            .toBe("No error handler registered for request /baseline/.");
        expect((console.log as jest.Mock).mock.calls[0][0].errors[0].detail)
            .toBe("some error message");
    });

    it("throws the first error message by default", async () => {

        mockAxios.onGet(`/unusual/`)
            .reply(500, mockFailure("some error message"));

        let error: Error;
        try {
            await api(jest.fn())
                .get("/unusual/");

        } catch (e) {
            error = e
        }

        expect((console.warn as jest.Mock).mock.calls[0][0])
            .toBe("No error handler registered for request /unusual/.");
        expect(error!!.message).toBe("some error message");
    });

    it("commits the first error with the specified type if well formatted", async () => {

        mockAxios.onGet(`/baseline/`)
            .reply(500, mockFailure("some error message"));

        let committedType: any = false;
        let committedPayload: any = false;
        const commit = ({type, payload}: any) => {
            committedType = type;
            committedPayload = payload;
        };

        await api(commit as any)
            .withError("TEST_TYPE")
            .get("/baseline/");

        expect(committedType).toBe("TEST_TYPE");
        expect(committedPayload).toBe("some error message");
    });

    it("commits the success response with the specified type", async () => {

        mockAxios.onGet(`/baseline/`)
            .reply(200, mockSuccess(true));

        let committedType: any = false;
        let committedPayload: any = false;
        const commit = ({type, payload}: any) => {
            committedType = type;
            committedPayload = payload;
        };

        await api(commit as any)
            .withSuccess("TEST_TYPE")
            .get("/baseline/");

        expect(committedType).toBe("TEST_TYPE");
        expect(committedPayload).toBe(true);
    });

    it("throws error if API response is badly formatted", async () => {

        mockAxios.onGet(`/baseline/`)
            .reply(500);

        let error: Error;
        try {
            await api(jest.fn())
                .get("/baseline/");

        } catch (e) {
            error = e
        }
        expect(error!!.message).toBe("Could not parse API response");
    });

    it("does nothing on error if ignoreErrors is true", async () => {

        mockAxios.onGet(`/baseline/`)
            .reply(500, mockFailure("some error message"));

        await api(jest.fn())
            .withSuccess("whatever")
            .ignoreErrors()
            .get("/baseline/");

        expect((console.warn as jest.Mock).mock.calls.length).toBe(0);
    });

    it("warns if error and success handlers are not set", async () => {

        mockAxios.onGet(`/baseline/`)
            .reply(200, mockSuccess(true));

        await api(jest.fn())
            .get("/baseline/");

        const warnings = (console.warn as jest.Mock).mock.calls;

        expect(warnings[0][0]).toBe("No error handler registered for request /baseline/.");
        expect(warnings[1][0]).toBe("No success handler registered for request /baseline/.");
    });

});
