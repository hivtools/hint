# vue-charts
[![Build Status](https://travis-ci.com/reside-ic/vue-charts.svg?branch=master)](https://travis-ci.com/reside-ic/vue-charts)

## Installation
* Install from npm:
  ```
  npm install @reside-ic/vue-charts
  ```
* Import into your project and register components globally or locally:
  ```
  import {BarChartWithFilters} from "@reside-ic/vue-charts"
  
  // global
  Vue.component("bar-chart-with-filters", BarChartWithFilters)
  
  // or local
  new Vue({
    el: '#app',
    components: {
      BarChartWithFilters
    }
  })
  
  ```
* Include the following css file in your app: 
  ```
  dist/css/style.min.css
  ```
  
### Browser

To use the dynamic form component directly in the browser, 
just include `dist/js/vue-charts.min.js` on the page, after Vue and Chart.js:

```
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.7.1/Chart.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/vue/dist/vue.js"></script>
<script type="text/javascript" src="node_modules/@reside-ic/vue-charts/dist/vue-charts.min.js"></script>
```

In this case the component will be automatically registered. 

## Components
### BarChartWithErrors
A simple extension of the `vue-chartjs` component which includes error bars.
See [examples/basicbarchart.html](https://reside-ic.github.io/vue-charts/examples/basicbarchart.html).

### BarChartWithFilters
A fancier bar chart that gives the user control over what is plotted. At least 2 dimensions for filtering the data
must be provided. 

#### Props
This component has 4 required props.
#### chartData
The first one is the data array itself. Array item fields must include
* a value field
* a field specifying what the value means
* a lower bound for the value
* an upper bound for the value
* at least 2 other dimensions

So this is valid data:

```
[
    {
        value: 0.1, indicator: "prev", e_l: 0.09, e_h: 0.11, age: "<5", sex: "1"
    },
    {
        value: 0.2, indicator: "prev", e_l: 0.19, e_h: 0.21, age: "<5", sex: "2"
    },
    {
        value: 0.1, indicator: "inc", e_l: 0.05, e_h: 0.15, age: "<5", sex: "1"
    },
    {
        value: 0.05, indicator: "inc", e_l: 0.01, e_h: 0.07, age: "<5", sex: "2"
    }
]
```

and so is this:
```
[
    {
        count: 10, metric: "prev", lower_bound: 9, upper_bound: 11, year: 2001, country: "AFG"
    },
    {
        count: 12, metric: "prev", lower_bound: 12, upper_bound: 13, year: 2002, country: "AFG"
    }
]
```

#### indicators
The indicators prop contains metadata about the data array. It specifies the names of the 
 required fields, and which metrics to plot.

```
[{
        indicator: "prev", // id for this metric (for internal use)
        name: "Prevalence", // display name for this metric
        value_column: "value", // field containing the values
        indicator_column: "indicator", // field that specifies the meaning of the value
        indicator_value: "prev", // name of this metric
        error_low_column: "e_l", // field containing the lower bound
        error_high_column: "e_h", // field containing the upper bound
        format: "0.00", //format string which may allow formatFunction to format indicator values for display
        scale: 1, //scaling factor which formatFunction may use to adjust indicator values for display
        accuracy: null //optional accuracy value which formatFunction may use to round indicator values for display
},
{
        indicator: "inc",
        name: "Incidence",
        value_column: "value",
        indicator_column: "indicator",
        indicator_value: "inc",
        error_low_column: "e_l",
        error_high_column: "e_h",
        format: "0.00",
        scale: 1,
        accuracy
}]
```

#### filterConfig
This contains optional label text for the various filter sections, and an array of filters (must
contain at least 2.)
```
{
    indicatorLabel: "Metric", // optional, defaults to "Indicator"
    xAxisLabel: "Compare across", // optional, defaults to "X Axis"
    disaggLabel: "Disaggregate by", // optional, defaults to "Disaggregate by"
    filterLabel: "Options", // optional, defaults to "Filters"
    filters: [
        {
            id: "age",
            label: "Age",
            options: [{id: "<5", label: "<5"}, {id: "5-10", label: "5-10"}],
            column_id: "age"
        },
        {
            id: "sex",
            label: "Sex",
            options: [{id: "1", label: "male"}, {id: "2", label: "female"}],
            column_id: "sex"
        }
    ]
}
```

#### selections
Initially selected values for the x axis, disaggregation, and any filters:

```
{   
    indicatorId: "prev", // must correspond to an indicator id from indicators
    xAxisId: "age", // must correspond to a filter id from filterConfig
    disaggregateById: "sex", // must correspond to a filter id from filterConfig
    selectedFilterOptions:  {
        sex: [{id: "1", label: "male"},{id: "2", label: "male"}]
        age: [{id: "<5", label: "<5"}]
    }
}
```


#### formatFunction
Optional function of type `(value: string | number, indicator: BarchartIndicator) => string`. If provided, this will be
used to format the given indicator values for display on the barchart y-axis and tooltips. The tooltips can also show
the ranges of the error bars by setting the optional prop `showRangesInTooltips` to true (this is false by default).

For a full example see [examples/barchart.html](https://reside-ic.github.io/vue-charts/examples/barchart.html).

#### xAxisConfig
Optional configuration specifying whether the x axis should be fixed (i.e. the user cannot select a different filter
from the default to use for the x axis) and whether the x axis filter should be hidden so the user cannot edit the selected
values. Both `fixed` and `hideFilter` default to `false`.
```
{
    fixed: true,
    hideFilter: false
}
```

#### disaggregateByConfig
Optional configuration specifying whether the 'disaggregate by' value should be fixed (i.e. the user cannot select a different filter
from the default to use for disaggregation) and whether the disaggregate by filter should be hidden so the user cannot edit the selected
values. Both `fixed` and `hideFilter` default to `false`.
```
{
    fixed: true,
    hideFilter: false
}
```  

#### noDataMessage
Optional configuration specifying whether a message is displayed over the barchart when the current combination of filter selections have
no data available for them. Takes the message to be displayed as a `string`. Set to `null` by default, with no message being displayed.


## Development
  * To run unit tests with jest: `npm test`
  * To build distribution files: `npm run build`
  * To publish to npm: 
      * first iterate the version in `package.json`
      * then `npm publish --access public`




