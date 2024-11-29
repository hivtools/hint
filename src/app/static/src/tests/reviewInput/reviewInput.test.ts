import {mockReviewInputState} from "../mocks";
import {reviewInputGetters} from "../../app/store/reviewInput/reviewInput";

describe("review input getters", () => {
    it('ageGroupOptions returns an array of possible age group', ()=> {
        const metadata = {
            filterTypes: [
                {
                    id: 'age',
                    column_id: 'age_group',
                    options: [
                        {id:"Y000_004",label:"0-4"},
                        {id:"Y005_009",label:"5-9"},
                        {id:"Y010_014",label:"10-14"}
                    ]}
            ],
            indicators: [],
            plotSettingsControl: {
                population: {
                    plotSettings: []
                },
            }
        }

        const state = mockReviewInputState({
            population: {
                loading: false,
                error: null,
                data: metadata
            }
        });

        const expected = [
            {id:"Y010_014",label:"10-14"},
            {id:"Y005_009",label:"5-9"},
            {id:"Y000_004",label:"0-4"}
        ];

        expect(reviewInputGetters.ageGroupOptions(state)).toStrictEqual(expected);
    })

    it('ageGroupOptions returns an empty array if no age options', ()=> {
        const metadata = {
            filterTypes: [
                {
                    id: 'year',
                    column_id: 'year',
                    options: [
                        {id:"2000",label:"2000"}
                    ]}
            ],
            indicators: [],
            plotSettingsControl: {
                population: {
                    plotSettings: []
                },
            }
        }

        const state = mockReviewInputState({
            population: {
                loading: false,
                error: null,
                data: metadata
            }
        });

        expect(reviewInputGetters.ageGroupOptions(state)).toStrictEqual([]);
    });
})
