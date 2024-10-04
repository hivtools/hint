import { Store } from "vuex";
import { RootState } from "../../../root";

export const getTimeSeriesData = (store: Store<RootState>) => {
    if (!store.state.surveyAndProgram.program?.data) return;
    const art = store.state.surveyAndProgram.program.data;
    const selection = store.state.plotSelections.timeSeries;
    const plotType = selection.filters.find(f => f.stateFilterId === "plotType")!.selection[0].id;
    // const areaLevelSelected = parseInt(selection.filters.find(f => f.stateFilterId === "detail")!.selection[0].id);
    const areaLevelSelected = 2;
    const quarters = selection.filters.find(f => f.stateFilterId === "quarter")!.selection.map(s => s.id);
    const features = store.state.baseline.shape!.data.features!;
    // console.log({features})
    // console.log({plotType})
    // console.log({areaLevel})
    // console.log({quarters})
    console.log({areaLevelSelected})

    let maxAreaLevelForData = 0;
    art.forEach(d => {
        if (d.area_level > maxAreaLevelForData) {
            maxAreaLevelForData = d.area_level
        }
    });

    const areaIdToAreaLevel: Record<string, number> = {};
    features.forEach(f => {
        areaIdToAreaLevel[f.properties.area_id] = f.properties.area_level;
    });

    // const areasForAreaLevel = features.filter(f => f.properties.area_level === parseInt(areaLevel)).map(f => f.properties.area_id);
    const nestedAreaIds = store.state.metadata.reviewInputMetadata!.filterTypes.find(f => f.id === "area")!.options;

    // console.log({areasForAreaLevel})
    console.log({nestedAreaIds});
    // return;

    const areaIdToLowestChildren: Record<string, string[]> = {};

    console.time("stack")
    const stack = [...nestedAreaIds];
    while (stack.length !== 0) {
        const currArea = stack.pop()! as any;
        const areaLevel = areaIdToAreaLevel[currArea.id];
        if (areaLevel === areaLevelSelected) {
            if (areaLevel === maxAreaLevelForData) {
                areaIdToLowestChildren[currArea.id] = [currArea.id];
            } else {
                areaIdToLowestChildren[currArea.id] = [];
                const miniStack = [...currArea.children];
                while (miniStack.length !== 0) {
                    const miniCurrArea = miniStack.pop()!;
                    const miniAreaLevel = areaIdToAreaLevel[miniCurrArea.id];
                    if (miniAreaLevel === maxAreaLevelForData) {
                        areaIdToLowestChildren[currArea.id].push(miniCurrArea.id);
                    } else {
                        miniStack.unshift(...miniCurrArea.children);
                    }
                }
                if (areaIdToLowestChildren[currArea.id].length === 0) {
                    console.log(`deleting ${currArea.id}`)
                    delete areaIdToLowestChildren[currArea.id];
                }
            }
        } else {
            stack.unshift(...currArea.children);
        }
    }
    console.timeEnd("stack")

    console.log({areaIdToLowestChildren});

    const areaIdToData: Record<string, any> = {};

    const filteredData = art
        .filter(d => d["area_level"] === maxAreaLevelForData && quarters.includes(d.calendar_quarter.slice(-2)));

    const allCalendarQuarters: string[] = [];
    filteredData.forEach(d => {
        if (!allCalendarQuarters.includes(d.calendar_quarter)) {
            allCalendarQuarters.push(d.calendar_quarter);
        }
    })

    // console.log({allCalendarQuarters})

    const dataObj: Record<string, any> = {};
    // console.log(features!.filter(f => f.properties.area_level === maxAreaLevelForData));
    features!.filter(f => f.properties.area_level === maxAreaLevelForData).forEach(f => {
        allCalendarQuarters.forEach(cq => {
            dataObj[`${f.properties.area_id}/${cq}`] = {
                art_total: 0,
                art_adult: 0,
                art_adult_f: 0,
                art_adult_m: 0,
                art_child: 0,
                art_new_total: 0,
                art_new_adult: 0,
                art_new_adult_f: 0,
                art_new_adult_m: 0,
                art_new_child: 0,
                vl_tested_12mos_total: 0,
                vl_tested_12mos_adult: 0,
                vl_tested_12mos_adult_f: 0,
                vl_tested_12mos_adult_m: 0,
                vl_tested_12mos_child: 0,
                vl_suppressed_12mos_total: 0,
                vl_suppressed_12mos_adult: 0,
                vl_suppressed_12mos_adult_f: 0,
                vl_suppressed_12mos_adult_m: 0,
                vl_suppressed_12mos_child: 0
            };
        });
    });

    // console.log({dataObj})
    // return;

    filteredData.forEach(d => {
        const key = `${d.area_id}/${d.calendar_quarter}`;
        dataObj[key].art_total += d.art_current || 0;
        dataObj[key].art_adult += d.art_current && d.age_group === "Y015_999" ? d.art_current : 0;
        dataObj[key].art_adult_f += d.art_current && d.age_group === "Y015_999" && d.sex === "female" ? d.art_current : 0;
        dataObj[key].art_adult_m += d.art_current && d.age_group === "Y015_999" && d.sex === "male" ? d.art_current : 0;
        dataObj[key].art_child += d.art_current && d.age_group === "Y000_014" ? d.art_current : 0;

        dataObj[key].art_new_total += d.art_new || 0;
        dataObj[key].art_new_adult += d.art_new && d.age_group === "Y015_999" ? d.art_new : 0;
        dataObj[key].art_new_adult_f += d.art_new && d.age_group === "Y015_999" && d.sex === "female" ? d.art_new : 0;
        dataObj[key].art_new_adult_m += d.art_new && d.age_group === "Y015_999" && d.sex === "male" ? d.art_new : 0;
        dataObj[key].art_new_child += d.art_new && d.age_group === "Y000_014" ? d.art_new : 0;

        dataObj[key].vl_tested_12mos_total += d.vl_tested_12mos || 0;
        dataObj[key].vl_tested_12mos_adult += d.vl_tested_12mos && d.age_group === "Y015_999" ? d.vl_tested_12mos : 0;
        dataObj[key].vl_tested_12mos_adult_f += d.vl_tested_12mos && d.age_group === "Y015_999" && d.sex === "female" ? d.vl_tested_12mos : 0;
        dataObj[key].vl_tested_12mos_adult_m += d.vl_tested_12mos && d.age_group === "Y015_999" && d.sex === "male" ? d.vl_tested_12mos : 0;
        dataObj[key].vl_tested_12mos_child += d.vl_tested_12mos && d.age_group === "Y000_014" ? d.vl_tested_12mos : 0;

        dataObj[key].vl_suppressed_12mos_total += d.vl_suppressed_12mos || 0;
        dataObj[key].vl_suppressed_12mos_adult += d.vl_suppressed_12mos && d.age_group === "Y015_999" ? d.vl_suppressed_12mos : 0;
        dataObj[key].vl_suppressed_12mos_adult_f += d.vl_suppressed_12mos && d.age_group === "Y015_999" && d.sex === "female" ? d.vl_suppressed_12mos : 0;
        dataObj[key].vl_suppressed_12mos_adult_m += d.vl_suppressed_12mos && d.age_group === "Y015_999" && d.sex === "male" ? d.vl_suppressed_12mos : 0;
        dataObj[key].vl_suppressed_12mos_child += d.vl_suppressed_12mos && d.age_group === "Y000_014" ? d.vl_suppressed_12mos : 0;
    });

    console.log({dataObj})

    const fullDataObj: Record<string, any> = {};
    for (const upperAreaId in areaIdToLowestChildren) {
        const lowestChildren = areaIdToLowestChildren[upperAreaId];
        allCalendarQuarters.forEach(cq => {
            const upperKey = `${upperAreaId}/${cq}`;
            let sum = 0;
            lowestChildren.forEach(child => {
                const childKey = `${child}/${cq}`;
                sum += dataObj[childKey].art_total;
            });
            fullDataObj[upperKey] = sum;
        });
    }

    const areaIdsInData: string[] = [];
    filteredData.forEach(d => {
        if (!areaIdsInData.includes(d.area_id)) {
            areaIdsInData.push(d.area_id);
        }
    });
    console.log({areaIdsInData})
    const completelyMissingIds: string[] = [];
    console.log(features.filter(f => f.properties.area_level === areaLevelSelected).map(f => f.properties.area_id));
    features.filter(f => f.properties.area_level === areaLevelSelected).map(f => f.properties.area_id).forEach(id => {
        if (!areaIdsInData.includes(id)) {
            completelyMissingIds.push(id);
        }
    });
    // Object.keys(areaIdToAreaLevel).forEach(id => {
    //     if (!areaIdsInData.includes(id)) {
    //         completelyMissingIds.push(id);
    //     }
    // });

    console.log({completelyMissingIds})



    // console.log({fullDataObj})
    
    const reshapedData = Object.entries(fullDataObj).map(([key, value]) => {
        const [area_id, calendar_quarter] = key.split("/");
        return {
            area_id,
            calendar_quarter,
            value
        }
    });

    console.log({reshapedData})
        // return {
        //     area_id,
        //     calendar_quarter,
        //     value
        // };
    // }).flat();

    // filteredData
    //     .map(d => ({
    //         // ...d,
    //         area_id: d.area_id,
    //         area_level: parseInt(d.area_level),
    //         area_name: features!.find(f => f.properties.area_id === d.area_id)!.properties.area_name,
    //         area_hierarchy: features!.find(f => f.properties.area_id === d.area_id)!.properties.area_name,
    //         plot: plotType,
    //         quarter: d.calendar_quarter.slice(-2),
    //         time_period: `${d.calendar_quarter.slice(2, -2)} ${d.calendar_quarter.slice(-2)}`,
    //         value: d["art_current"],
    //         missing_ids: d["art_current"] === null || d["art_current"] === undefined ? [d.area_id] : null
    //     }));
    // console.log(reshapedData);
    // console.log(selection);
    // console.log(store.state.plotData["timeSeries"])
    return null;
};

// const getValueFromPlotType = (d: any, plotType: string) => {

// };

// const buildTimeSeriesFilterTypes = (store: Store<RootState>) => {

// };

const buildARTPlotTypes = (store: Store<RootState>) => {
    if (!store.state.surveyAndProgram.program?.data) return;
    const art = store.state.surveyAndProgram.program.data;
    const plotTypes = [
        ...getStratForColumn("art"),
        "art_adult_sex_ratio", "art_child_adult_ratio"
    ];
    const cols = Object.keys(art[0]);
    if ("art_new" in cols) {
        plotTypes.push(...getStratForColumn("art_new"));
    }
    if ("vl_tested_12mos" in cols && "vl_suppressed_12mos" in cols) {
        const vlPlotTypes = [
            ...getStratForColumn("vl_tested_12mos"),
            ...getStratForColumn("vl_suppressed_12mos"),
            ...getStratForColumn("vl_coverage"),
            ...getStratForColumn("vl_prop_suppressed")
        ];
        plotTypes.push(...vlPlotTypes);
    }
};

const getStratForColumn = (colName: string) => {
    return [
        `${colName}_total`,
        `${colName}_adult`,
        `${colName}_adult_f`,
        `${colName}_adult_m`,
        `${colName}_child`
    ];
};

const getSexStratForColumn = (colName: string) => {
    return [
        `${colName}_adult_f`,
        `${colName}_adult_m`
    ];
};