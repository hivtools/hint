import {mockMetadataState, mockReviewInputMetadata} from "../mocks";
import {metadataGetters} from "../../app/store/metadata/metadata";

describe("Metadata ", () => {
    it("returns true if review input metadata avaialble", () => {
        const state = mockMetadataState();
        expect(metadataGetters.complete(state)).toBe(false);

        const completeState = mockMetadataState({
            reviewInputMetadata: mockReviewInputMetadata()
        });
        expect(metadataGetters.complete(completeState)).toBe(true);
    })
});
