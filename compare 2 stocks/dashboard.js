// Function to fetch data from the API
async function fetchData(symbol, apiKey, days) {
    const apiUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=full&apikey=${apiKey}`;
  
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('There was a problem with the fetch operation:', error);
      return null;
    }
  }
  
  // Function to transform fetched data into format suitable for line chart
  function transformData(data, days) {
    const timeSeries = data["Time Series (Daily)"];
    const dates = Object.keys(timeSeries).sort().slice(0, days);
    const stockData = dates.map(date => {
      const dailyData = timeSeries[date];
      return {
        date: new Date(date),
        close: +dailyData["4. close"],
      };
    });
    return stockData;
  }
  
  // Function to create line chart comparing two stocks
  function createLineChart(data1, data2) {
    // Declare the chart dimensions and margins.
    const width = 928;
    const height = 500;
    const marginTop = 20;
    const marginRight = 30;
    const marginBottom = 30;
    const marginLeft = 40;
  
    // Declare the x (horizontal position) scale.
    const x = d3.scaleUtc(d3.extent(data1.concat(data2), d => d.date), [marginLeft, width - marginRight]);
  
    // Declare the y (vertical position) scale.
    const y = d3.scaleLinear([0, d3.max(data1.concat(data2), d => d.close)], [height - marginBottom, marginTop]);
  
    // Declare the line generator.
    const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.close));
  
    // Create the SVG container.
    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto; height: intrinsic;");
  
    // Add the x-axis.
    svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0));
  
    // Add the y-axis, remove the domain line, add grid lines and a label.
    svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(d3.axisLeft(y).ticks(height / 40))
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line").clone()
            .attr("x2", width - marginLeft - marginRight)
            .attr("stroke-opacity", 0.1))
        .call(g => g.append("text")
            .attr("x", -marginLeft)
            .attr("y", 10)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .text("↑ Daily close ($)"));
  
    // Append path for the first line.
    svg.append("path")
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", line(data1));
  
    // Append path for the second line.
    svg.append("path")
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-width", 1.5)
        .attr("d", line(data2));
  
    return svg.node();
  }
  
  // Main function to fetch data and create chart
  async function main() {
    const apiKey = 'YOUR_API_KEY'; // Replace 'YOUR_API_KEY' with your actual API key
    const symbol1Input = document.getElementById('symbol1');
    const symbol2Input = document.getElementById('symbol2');
    const daysSlider = document.getElementById('days');
    const selectedDays = document.getElementById('selectedDays');
  
    // Initial chart render
    let data1 = await fetchData(symbol1Input.value, apiKey, daysSlider.value);
    let data2 = await fetchData(symbol2Input.value, apiKey, daysSlider.value);
    if (data1 && data2) {
      const transformedData1 = transformData(data1, daysSlider.value);
      const transformedData2 = transformData(data2, daysSlider.value);
      const chart = createLineChart(transformedData1, transformedData2);
      document.getElementById('chart').appendChild(chart);
    } else {
      console.error('Failed to fetch data or transform data.');
    }
  
    // Update chart when slider value changes
    daysSlider.addEventListener('input', async () => {
      selectedDays.textContent = `${daysSlider.value} days`;
      const newData1 = await fetchData(symbol1Input.value, apiKey, daysSlider.value);
      const newData2 = await fetchData(symbol2Input.value, apiKey, daysSlider.value);
      if (newData1 && newData2) {
        const transformedData1 = transformData(newData1, daysSlider.value);
        const transformedData2 = transformData(newData2, daysSlider.value);
        const chart = createLineChart(transformedData1, transformedData2);
        document.getElementById('chart').innerHTML = '';
        document.getElementById('chart').appendChild(chart);
      } else {
        console.error('Failed to fetch data or transform data.');
      }
    });
  
    // Update chart when symbol 1 input changes
    symbol1Input.addEventListener('input', async () => {
      const newData1 = await fetchData(symbol1Input.value, apiKey, daysSlider.value);
      if (newData1) {
        data1 = newData1;
        const transformedData1 = transformData(newData1, daysSlider.value);
        const transformedData2 = transformData(data2, daysSlider.value);
        const chart = createLineChart(transformedData1, transformedData2);
        document.getElementById('chart').innerHTML = '';
        document.getElementById('chart').appendChild(chart);
      } else {
        console.error('Failed to fetch data or transform data.');
      }
    });
  
    // Update chart when symbol 2 input changes
    symbol2Input.addEventListener('input', async () => {
      const newData2 = await fetchData(symbol2Input.value, apiKey, daysSlider.value);
      if (newData2) {
        data2 = newData2;
        const transformedData1 = transformData(data1, daysSlider.value);
        const transformedData2 = transformData(newData2, daysSlider.value);
        const chart = createLineChart(transformedData1, transformedData2);
        document.getElementById('chart').innerHTML = '';
        document.getElementById('chart').appendChild(chart);
      } else {
        console.error('Failed to fetch data or transform data.');
      }
    });
  }
  
  // Execute main function
  main();
  