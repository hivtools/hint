## Generic Chart

We have a Generic Chart in the front end. This is currently only used to display Input Time Series charts - 
however it has been designed to generically accept configuration, chart metadata, and chart data and to display the 
resultant chart using the [Plotly](https://plotly.com/javascript/) library. 

GenericChart is intended to be rather self-contained, for example, including its own filter and data source components. 
However it does make use of the store to handle chart data and metadata. This is to avoid the chart needing to re-fetch 
data when it is reloaded.  

Input Time Series, the sole current implementation for Generic Chart, has custom datasets which must be fetched from 
hintr - the url to use is included in the dataset config. However, the chart config could be extended to allow generic 
chart visualisations of the standard input and output datasets in the store. 

This diagram shows the main constituents and data flow involved in showing Generic Chart:
 ![Diagram of Generic Chart](GenericChart.png "Diagram of Generic Chart")


When the app is first loaded, Generic Chart metadata is fetched from the endpoint, and is stored for the duration of the 
front end app. It is stored in GenericChart state. This metadata consists of a dictionary of chart ids, with 
configuration for each, which instructs the component how to display the chart, including what data sources to use, 
what filters to apply, and a jsonata template describing the plotly configuration to use. See below for further details. 

Generic Chart metadata is currently kept in resource files in the back end of HINT. However we may in future hand over 
this metadata to hintr, and have HINT fetch metadata from hintr as well as data. 

Wherever the GenericChart component appears, it is provided with its chart id in a prop, and pulls out the relevant 
section from the metadata. The chart metadata defines urls from which to fetch datasets (e.g. the custom input time series datasets) - the component invokes an action on the GenericChart state to retrieve this data when required, and it is stored in the GenericChart state along with dataset id. 

Currently, GenericChart component is only located in the SurveyAndProgram component, on the 'Time series' tab.

GenericChart has these sub-components:
- **DataSource**: used to select a dataset to display in the chart for a given datasource. There could potentially be multiple datasources per GenericChart (e.g. one for each of X and Y axis), but for Input Time Series, we only have one. 'Data source', for which the available datasets are 'ART' and 'ANC Testing'. Selecting a new data set, or loading the component with default datasets selected, causes the component to invoke the store to fetch any datasets which have not yet been fetched. 
- **Filters**: this is the same Filters component used elsewhere in HINT. There is one Filters component per data source. Currently, we use filter options defined in the dataset response itself, as for other datasets in HINT. We could potentially customise filters for other applications of GenericChart e.g. some filter options might not be available for some charts. 
- **Plotly**: an implementation which combines provided chart data and metadata as a jsonata template to a full plotly configuration and loads it using the Plotly library. This is very similar to the Chart component in comet. Minor changes from that impleentation are that we are using the `newPlot` method instead of `react` to accommodate updates to chart height when the number of subplots change due to filter changes (particularly are level), and we are using a more light-weight Plotly distribution, plotly-js.basic-dist.

### Generic Chart Metadata

The Generic Chart Metadata consists of a dictionary of GenericChartMetadata objects, whose keys are the chart ids. Here is an annotated example of GenericChartMetadata:
```
{
      // This section configures the datasets available to the charts, and where to get them from
      "datasets": [  
        {
          // id by which chart will identify dataset - the id used in the dict of datasets in the store
          "id": "art",  

          // translation key of label to display for the option for this dataset in the Data source component
          "label": "ART",  

          // endpoint from which to fetch this dataset
          "url": "/chart-data/input-time-series/programme",

	  // which filters to display for this dataset, and where to get their metadata (i.e. their filter options). 
	  // "data" is the only currently supported option i.e. get the filters from the metadata property dataset itself	
          "filters": [ 
            {
              "id": "plot_type",
              "source": "data"
            },
            {
              "id": "area_level",
              "source": "data"
            },
            {
              "id": "time_step",
              "source": "data"
            }
          ]
        },
        {
          "id": "anc",
          "label": "ANC",
          "url": "/chart-data/input-time-series/anc",
          "filters": [
            {
              "id": "plot_type",
              "source": "data"
            },
            {
              "id": "area_level",
              "source": "data"
            },
            {
              "id": "age",
              "source": "data"
            }
          ]
        }
      ],
      "dataSelectors": {
	// Data source is currently the only type of data selector supported.
	// A data source has a particular role in the chart. The user selects which dataset to use for each data source. 
        "dataSources": [
          {
            // Id for this data source
            "id": "data",

	    // A data source might not be editable if only one dataset was available
            "type": "editable", 

            // Translation key for the label to use for the data source selector		
            "label": "dataSource",  

	    // Default dataset id to use for the data source		
            "datasetId": "art",

	    // Will be used to show or hide controls for user to select indicator (not yet implemented)
            "showIndicators": false,

	    // Show or hide controls for user to select filter values
            "showFilters": true
          }
        ]
      },
      // Subplot configuration for the chart, if any. Used by GenericChart component to calculate the scroll height area.
      "subplots": {
	// Number of subplots to display per row
        "columns": 3,

	// The column in the data for which a subplot will be shown for each distinct value. 
        "distinctColumn": "area_name",

	// Height in pixels which should be allowed for each row of subplts.
        "heightPerRow": 140
      },
      // This is an array as a future implementation may allow multiple chart types per chart e.g. scatter and bar. 
      // Only one chart config per chart is currently supported		
      "chartConfig": [
        {
          "id": "scatter",

	  // When implemented, this is the translation key for the label to be displayed for this chart type's option 	
          "label": "Scatter",
		
          "config": "...The jsonata config string goes here - see below for more details on this..."
        }
      ]
    }

```

### Chart Config Jsonata
    

### GenericChart component logic

In order to provide its child components with the data and metadata they need, GenericChart computes the following properties:



### Front end data types
