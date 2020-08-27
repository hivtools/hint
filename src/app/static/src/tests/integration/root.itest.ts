import {actions as rootActions, actions} from "../../app/store/root/actions";
import {login, rootState} from "./integrationTest";
import {RootMutation} from "../../app/store/root/mutations";
import {ADRSchemas} from "../../app/types";

describe("Root actions", () => {

    beforeAll(async () => {
        await login();
    });

    beforeEach(async () => {
        await rootActions.saveADRKey({commit: jest.fn(), rootState} as any, "123");
    });

    it("can fetch ADR key", async () => {
        const commit = jest.fn();
        await actions.fetchADRKey({commit, rootState} as any);

        expect(commit.mock.calls[0][0]["type"]).toBe(RootMutation.UpdateADRKey);
        expect(commit.mock.calls[0][0]["payload"]).toBe("123");
    });

    it("can save ADR key", async () => {
        const commit = jest.fn();
        await actions.saveADRKey({commit, rootState} as any, "1234");

        expect(commit.mock.calls[1][0]["type"]).toBe(RootMutation.UpdateADRKey);
        expect(commit.mock.calls[1][0]["payload"]).toBe("1234");
    });

    it("can delete ADR key", async () => {
        const commit = jest.fn();
        await actions.deleteADRKey({commit, rootState} as any);

        expect(commit.mock.calls[1][0]["type"]).toBe(RootMutation.UpdateADRKey);
        expect(commit.mock.calls[1][0]["payload"]).toBe(null);
    });

    it("can fetch ADR datasets", async () => {
        const commit = jest.fn();
        await actions.getADRDatasets({commit, rootState} as any);

        expect(commit.mock.calls[0][0]["type"]).toBe(RootMutation.SetADRDatasets);
        expect(commit.mock.calls[0][0]["payload"]).toEqual([]);
    });

    it("can fetch ADR schemas", async () => {
        const commit = jest.fn();
        await actions.getADRSchemas({commit, rootState} as any);

        expect(commit.mock.calls[0][0]["type"]).toBe(RootMutation.SetADRSchemas);
        const payload = commit.mock.calls[0][0]["payload"] as ADRSchemas;
        expect(payload.baseUrl).toBe("https://dev.adr.fjelltopp.org/")
    });
});
