import {api} from "../app/apiService";
import {mockAxios, mockFailure} from "./mocks";
import {Commit} from "vuex";

describe("ApiService", () => {

    beforeEach(() => {
        console.log = jest.fn();
    });

    afterEach(() => {
        (console.log as jest.Mock).mockClear()
    });

    it("console logs error", async () => {
        mockAxios.onGet(`/baseline/`)
            .reply(500, mockFailure("some error message"));

        try {
            await api().get("/baseline/")
        } catch (e) {

        }
        expect((console.log as jest.Mock).mock.calls[0][0].message)
            .toBe("Request failed with status code 500");
    });

    it("throws the first error message by default", async () => {

        mockAxios.onGet(`/unusual/`)
            .reply(500, mockFailure("some error message"));

        let error: Error;
        try {
            await api()
                .get("/unusual/");

        } catch (e) {
            error = e
        }
        expect(error!!.message).toBe("some error message");
    });

    it("commits the first error with the specified type if well formatted", async () => {

        mockAxios.onGet(`/baseline/`)
            .reply(500, mockFailure("some error message"));

        let committedType: any = false;
        let committedPayload: any = false;
        const commit: Commit = ({type, payload}) => {
            committedType = type;
            committedPayload = payload;
        };

        await api().commitFirstErrorAsType(commit, "TEST_TYPE")
            .get("/baseline/");

        expect(committedType).toBe("TEST_TYPE");
        expect(committedPayload).toBe("some error message");
    });

    it("throws error if API response is badly formatted", async () => {

        mockAxios.onGet(`/baseline/`)
            .reply(500);

        let error: Error;
        try {
            await api()
                .get("/baseline/");

        } catch (e) {
            error = e
        }
        expect(error!!.message).toBe("Could not parse API response");
    });

    it("does nothing on error if ignoreErrors is true", async () => {

        mockAxios.onGet(`/baseline/`)
            .reply(500, mockFailure("some error message"));

        await api().ignoreErrors()
            .get("/baseline/")
    });

});
