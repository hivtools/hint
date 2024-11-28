import {Dict} from "../../types";
import {PopulationResponseData} from "../../generated";

export const aggregatePopulation = (data: PopulationResponseData, areaLevel: number, areaIdToLevelMap: Dict<number>,
                                    areaIdToParentPath: Dict<string[]>, areaIdToAreaName: Dict<string>) => {

    const highestUploadedAreaLevel = Math.max(...new Set(data.map(ind=>areaIdToLevelMap[ind.area_id])));

    if (areaLevel > highestUploadedAreaLevel) {
        return [];
    }

    // Population data may be uploaded at multiple area levels. Check to see if there are existing indicators at
    // the selected area level, and if so use them to initialize the aggregation.
    const existingIndicators = data.filter(ind=>areaIdToLevelMap[ind.area_id] === areaLevel)

    const aggregatePopulationIndicators = () => {
        // Indicators at the most disaggregated area level will be used to create aggregated indicators if they do not already exist.
        // This assumes complete data at the most disaggregated area level.
        const indicatorsToAggregate = data.filter(ind=>areaIdToLevelMap[ind.area_id] === highestUploadedAreaLevel)
        return indicatorsToAggregate.reduce((acc, ind)=>{
            const {area_id, calendar_quarter, age_group, sex, population} = ind;
            const matchingParentId = areaIdToParentPath[area_id][areaLevel];

            // Check to see if the corresponding parent was already uploaded in population data.
            // If it was, it is used directly and we don't need to do any aggregation for it.
            const shouldAggregate = !existingIndicators.some(ind=>ind.area_id === matchingParentId)
            if (!shouldAggregate) return acc

            const existingIndicator = acc.find((indicator: any)=>indicator.area_id === matchingParentId && indicator.calendar_quarter === calendar_quarter && indicator.age_group === age_group && indicator.sex === sex)
            if (existingIndicator) {
                existingIndicator.population += population;
            } else {
                const name = areaIdToAreaName[matchingParentId]

                acc.push({
                    age_group,
                    area_name: name,
                    area_id: matchingParentId,
                    calendar_quarter,
                    population,
                    sex
                });
            }
            return acc
        }, [...existingIndicators]);
    }

    return areaLevel === highestUploadedAreaLevel ? existingIndicators : aggregatePopulationIndicators()
}
